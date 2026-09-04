from datetime import datetime
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.lender import LenderOfficer
from app.models.application import Application
from app.models.loan import Loan
from app.models.loan_term import LoanTerm
from app.models.enums import ApplicationStatus, LoanStatus
from app.schemas.application import (
    ApplicationListItem,
    ApplicationDetail,
    ApproveRequest,
    CounterOfferRequest,
    RejectRequest,
)
from app.schemas.seeker import FinancialProfile
from app.services.score_service import score_tier_from_score
from app.dependencies.auth import get_current_officer

router = APIRouter(prefix="/applications", tags=["applications"])


def _to_list_item(app: Application) -> ApplicationListItem:
    return ApplicationListItem(
        id=app.id,
        applicant_name=app.seeker.name,
        trust_score_snapshot=app.trust_score_snapshot,
        score_tier=score_tier_from_score(app.trust_score_snapshot),
        requested_amount=app.requested_amount,
        loan_type=app.loan_type,
        status=app.status.value,
        created_at=app.created_at,
    )


def _to_detail(app: Application, db: Session) -> ApplicationDetail:
    seeker = app.seeker
    financial_profile = FinancialProfile(
        avg_monthly_inflow=seeker.avg_monthly_inflow,
        avg_monthly_outflow=seeker.avg_monthly_outflow,
        avg_monthly_surplus=seeker.avg_monthly_inflow - seeker.avg_monthly_outflow,
        transaction_frequency_per_month=seeker.transaction_frequency_per_month,
        active_financial_sources=seeker.active_financial_sources,
        financial_history_months=seeker.financial_history_months,
    )

    tier = score_tier_from_score(app.trust_score_snapshot)
    active_terms = (
        db.query(LoanTerm)
        .filter(
            LoanTerm.lender_id == app.lender_id,
            LoanTerm.score_tier == tier,
            LoanTerm.expired_date.is_(None),
        )
        .all()
    )
    reference_bands = [
        {
            "interest_rate": str(t.interest_rate),
            "tenure_months": t.tenure_months,
            "processing_fee": str(t.processing_fee),
        }
        for t in active_terms
    ]

    return ApplicationDetail(
        id=app.id,
        applicant_name=seeker.name,
        trust_score_snapshot=app.trust_score_snapshot,
        score_tier=tier,
        requested_amount=app.requested_amount,
        loan_type=app.loan_type,
        status=app.status.value,
        created_at=app.created_at,
        seeker_id=seeker.id,
        score_factors_snapshot=app.score_factors_snapshot,
        financial_profile=financial_profile,
        counter_amount=app.counter_amount,
        counter_rate=app.counter_rate,
        counter_tenure_months=app.counter_tenure_months,
        rejection_reason=app.rejection_reason,
        decided_at=app.decided_at,
        reference_rate_bands=reference_bands,
    )


def _get_scoped_application(app_id: str, db: Session, officer: LenderOfficer) -> Application:
    # Tenant isolation: always filter by officer.lender_id, never trust a
    # lender_id supplied by the client.
    app = (
        db.query(Application)
        .filter(Application.id == app_id, Application.lender_id == officer.lender_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.get("", response_model=list[ApplicationListItem])
def list_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(get_current_officer),
):
    query = db.query(Application).filter(Application.lender_id == officer.lender_id)
    if status_filter and status_filter != "all":
        query = query.filter(Application.status == ApplicationStatus(status_filter))

    applications = query.order_by(Application.created_at.desc()).limit(limit).all()

    if search:
        s = search.lower()
        applications = [
            a for a in applications if s in a.seeker.name.lower() or s in a.id.lower()
        ]

    return [_to_list_item(a) for a in applications]


@router.get("/{app_id}", response_model=ApplicationDetail)
def get_application(
    app_id: str,
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(get_current_officer),
):
    app = _get_scoped_application(app_id, db, officer)
    return _to_detail(app, db)


@router.post("/{app_id}/approve", response_model=ApplicationDetail)
def approve_application(
    app_id: str,
    payload: ApproveRequest,
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(get_current_officer),
):
    app = _get_scoped_application(app_id, db, officer)
    if app.status not in (ApplicationStatus.pending, ApplicationStatus.countered):
        raise HTTPException(status_code=400, detail=f"Cannot approve an application in '{app.status.value}' state")

    app.status = ApplicationStatus.approved
    app.decided_at = datetime.utcnow()

    loan = Loan(
        application_id=app.id,
        seeker_id=app.seeker_id,
        lender_id=app.lender_id,
        principal_amount=payload.loan_amount,
        interest_rate=payload.interest_rate,
        tenure_months=payload.tenure_months,
        processing_fee=payload.processing_fee,
        status=LoanStatus.approved,
    )
    db.add(loan)
    db.commit()
    db.refresh(app)
    return _to_detail(app, db)


@router.post("/{app_id}/counter", response_model=ApplicationDetail)
def counter_application(
    app_id: str,
    payload: CounterOfferRequest,
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(get_current_officer),
):
    app = _get_scoped_application(app_id, db, officer)
    if app.status not in (ApplicationStatus.pending, ApplicationStatus.countered):
        raise HTTPException(status_code=400, detail=f"Cannot counter an application in '{app.status.value}' state")

    app.status = ApplicationStatus.countered
    app.counter_amount = payload.counter_amount
    app.counter_rate = payload.counter_rate
    app.counter_tenure_months = payload.counter_tenure_months
    db.commit()
    db.refresh(app)
    return _to_detail(app, db)


@router.post("/{app_id}/reject", response_model=ApplicationDetail)
def reject_application(
    app_id: str,
    payload: RejectRequest,
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(get_current_officer),
):
    app = _get_scoped_application(app_id, db, officer)
    if app.status in (ApplicationStatus.approved, ApplicationStatus.rejected):
        raise HTTPException(status_code=400, detail=f"Cannot reject an application in '{app.status.value}' state")

    app.status = ApplicationStatus.rejected
    app.rejection_reason = payload.reason
    app.decided_at = datetime.utcnow()
    db.commit()
    db.refresh(app)
    return _to_detail(app, db)
