from collections import defaultdict
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.lender import LenderOfficer
from app.models.application import Application
from app.models.loan import Loan
from app.models.repayment_event import RepaymentEvent
from app.models.enums import ApplicationStatus, LoanStatus, RepaymentStatus
from app.schemas.lender import DashboardSummary, ApplicationStats, LoanStats, RepaymentStats
from app.dependencies.auth import get_current_officer

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db), officer: LenderOfficer = Depends(get_current_officer)):
    lender_id = officer.lender_id

    pending_applications = (
        db.query(Application)
        .filter(Application.lender_id == lender_id, Application.status == ApplicationStatus.pending)
        .count()
    )
    active_loans = (
        db.query(Loan)
        .filter(
            Loan.lender_id == lender_id,
            Loan.status.in_([LoanStatus.disbursed, LoanStatus.repaying]),
        )
        .count()
    )
    total_disbursed = (
        db.query(func.coalesce(func.sum(Loan.principal_amount), 0))
        .filter(Loan.lender_id == lender_id, Loan.status != LoanStatus.approved)
        .scalar()
    )

    events = (
        db.query(RepaymentEvent)
        .join(Loan, RepaymentEvent.loan_id == Loan.id)
        .filter(Loan.lender_id == lender_id)
        .all()
    )
    on_time = sum(1 for e in events if e.status == RepaymentStatus.on_time)
    on_time_pct = round((on_time / len(events)) * 100, 1) if events else 0.0

    return DashboardSummary(
        pending_applications=pending_applications,
        active_loans=active_loans,
        total_disbursed=Decimal(total_disbursed or 0),
        repayment_on_time_pct=on_time_pct,
    )


@router.get("/application-stats", response_model=ApplicationStats)
def application_stats(
    db: Session = Depends(get_db), officer: LenderOfficer = Depends(get_current_officer)
):
    apps = db.query(Application).filter(Application.lender_id == officer.lender_id).all()
    counts = defaultdict(int)
    by_date = defaultdict(int)
    for a in apps:
        counts[a.status.value] += 1
        by_date[a.created_at.date().isoformat()] += 1

    over_time = [{"date": d, "count": c} for d, c in sorted(by_date.items())]

    return ApplicationStats(
        pending=counts.get("pending", 0),
        countered=counts.get("countered", 0),
        approved=counts.get("approved", 0),
        rejected=counts.get("rejected", 0),
        over_time=over_time,
    )


@router.get("/loan-stats", response_model=LoanStats)
def loan_stats(db: Session = Depends(get_db), officer: LenderOfficer = Depends(get_current_officer)):
    loans = db.query(Loan).filter(Loan.lender_id == officer.lender_id).all()
    counts = defaultdict(int)
    for loan in loans:
        counts[loan.status.value] += 1

    return LoanStats(
        approved=counts.get("approved", 0),
        disbursed=counts.get("disbursed", 0),
        repaying=counts.get("repaying", 0),
        closed=counts.get("closed", 0),
    )


@router.get("/repayment-stats", response_model=RepaymentStats)
def repayment_stats(
    db: Session = Depends(get_db), officer: LenderOfficer = Depends(get_current_officer)
):
    events = (
        db.query(RepaymentEvent)
        .join(Loan, RepaymentEvent.loan_id == Loan.id)
        .filter(Loan.lender_id == officer.lender_id)
        .all()
    )
    total = len(events)
    if total == 0:
        return RepaymentStats(on_time_pct=0, late_pct=0, missed_pct=0, total_emis=0)

    on_time = sum(1 for e in events if e.status == RepaymentStatus.on_time)
    late = sum(1 for e in events if e.status == RepaymentStatus.late)
    missed = sum(1 for e in events if e.status == RepaymentStatus.missed)

    return RepaymentStats(
        on_time_pct=round(on_time / total * 100, 1),
        late_pct=round(late / total * 100, 1),
        missed_pct=round(missed / total * 100, 1),
        total_emis=total,
    )
