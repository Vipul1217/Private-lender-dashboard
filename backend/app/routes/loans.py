from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.lender import LenderOfficer
from app.models.loan import Loan
from app.models.enums import LoanStatus, RepaymentStatus
from app.schemas.loan import LoanListItem, LoanDetail, RepaymentEventItem
from app.dependencies.auth import get_current_officer

router = APIRouter(prefix="/loans", tags=["loans"])


def _repayment_summary(loan: Loan) -> str:
    events = loan.repayment_events
    if not events:
        return "No EMIs recorded yet"

    on_time = sum(1 for e in events if e.status == RepaymentStatus.on_time)
    late = sum(1 for e in events if e.status == RepaymentStatus.late)
    missed = sum(1 for e in events if e.status == RepaymentStatus.missed)

    upcoming = [e for e in events if e.paid_date is None and e.due_date >= date.today()]
    parts = []
    if on_time:
        parts.append(f"{on_time} on time")
    if late:
        parts.append(f"{late} late")
    if missed:
        parts.append(f"{missed} missed")
    if upcoming:
        parts.append(f"{len(upcoming)} due soon")
    return ", ".join(parts) if parts else "No EMIs recorded yet"


def _to_list_item(loan: Loan) -> LoanListItem:
    return LoanListItem(
        id=loan.id,
        applicant_name=loan.seeker.name,
        principal_amount=loan.principal_amount,
        interest_rate=loan.interest_rate,
        tenure_months=loan.tenure_months,
        status=loan.status.value,
        disbursed_date=loan.disbursed_date,
        repayment_status_summary=_repayment_summary(loan),
    )


def _to_detail(loan: Loan) -> LoanDetail:
    return LoanDetail(
        id=loan.id,
        applicant_name=loan.seeker.name,
        principal_amount=loan.principal_amount,
        interest_rate=loan.interest_rate,
        tenure_months=loan.tenure_months,
        status=loan.status.value,
        disbursed_date=loan.disbursed_date,
        repayment_status_summary=_repayment_summary(loan),
        application_id=loan.application_id,
        seeker_id=loan.seeker_id,
        processing_fee=loan.processing_fee,
        closed_date=loan.closed_date,
        repayment_events=[RepaymentEventItem.model_validate(e) for e in loan.repayment_events],
    )


@router.get("", response_model=list[LoanListItem])
def list_loans(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(get_current_officer),
):
    query = db.query(Loan).filter(Loan.lender_id == officer.lender_id)
    if status_filter and status_filter != "all":
        query = query.filter(Loan.status == LoanStatus(status_filter))
    loans = query.all()
    loans.sort(key=lambda l: l.disbursed_date or date.min, reverse=True)
    return [_to_list_item(loan) for loan in loans]


@router.get("/{loan_id}", response_model=LoanDetail)
def get_loan(
    loan_id: str,
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(get_current_officer),
):
    loan = (
        db.query(Loan)
        .filter(Loan.id == loan_id, Loan.lender_id == officer.lender_id)
        .first()
    )
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return _to_detail(loan)


# Not explicitly listed in the original API spec, but required to
# implement the stated workflow (Approved -> Disbursed -> Repaying ->
# Closed) end-to-end without a manual DB edit — sensible MVP addition.
@router.post("/{loan_id}/disburse", response_model=LoanDetail)
def disburse_loan(
    loan_id: str,
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(get_current_officer),
):
    loan = (
        db.query(Loan)
        .filter(Loan.id == loan_id, Loan.lender_id == officer.lender_id)
        .first()
    )
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan.status != LoanStatus.approved:
        raise HTTPException(status_code=400, detail="Only an approved loan can be disbursed")

    loan.status = LoanStatus.disbursed
    loan.disbursed_date = date.today()
    db.commit()
    db.refresh(loan)
    return _to_detail(loan)


@router.post("/{loan_id}/close", response_model=LoanDetail)
def close_loan(
    loan_id: str,
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(get_current_officer),
):
    loan = (
        db.query(Loan)
        .filter(Loan.id == loan_id, Loan.lender_id == officer.lender_id)
        .first()
    )
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan.status != LoanStatus.repaying:
        raise HTTPException(status_code=400, detail="Only a repaying loan can be closed")

    loan.status = LoanStatus.closed
    loan.closed_date = date.today()
    db.commit()
    db.refresh(loan)
    return _to_detail(loan)
