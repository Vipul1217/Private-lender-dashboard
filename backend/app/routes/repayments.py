from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.lender import LenderOfficer
from app.models.loan import Loan
from app.models.repayment_event import RepaymentEvent
from app.models.enums import LoanStatus, RepaymentStatus
from app.schemas.loan import RepaymentTableRow, RecordRepaymentRequest, RepaymentEventItem
from app.services.score_service import compute_score_impact
from app.dependencies.auth import get_current_officer

router = APIRouter(tags=["repayments"])


@router.get("/repayments", response_model=list[RepaymentTableRow])
def list_repayments(
    db: Session = Depends(get_db), officer: LenderOfficer = Depends(get_current_officer)
):
    events = (
        db.query(RepaymentEvent)
        .join(Loan, RepaymentEvent.loan_id == Loan.id)
        .filter(Loan.lender_id == officer.lender_id)
        .order_by(RepaymentEvent.due_date.desc())
        .all()
    )
    return [
        RepaymentTableRow(
            id=e.id,
            applicant_name=e.loan.seeker.name,
            loan_id=e.loan_id,
            emi_amount=e.emi_amount,
            due_date=e.due_date,
            paid_date=e.paid_date,
            status=e.status.value,
            score_impact=e.score_impact,
            created_at=e.created_at,
        )
        for e in events
    ]


@router.post("/loans/{loan_id}/repayments", response_model=RepaymentEventItem)
def record_repayment(
    loan_id: str,
    payload: RecordRepaymentRequest,
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

    try:
        status_enum = RepaymentStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="status must be one of: on_time, late, missed")

    score_impact = compute_score_impact(status_enum.value)

    event = RepaymentEvent(
        loan_id=loan.id,
        seeker_id=loan.seeker_id,
        emi_amount=payload.emi_amount,
        due_date=payload.due_date,
        paid_date=payload.paid_date,
        status=status_enum,
        score_impact=score_impact,
    )
    db.add(event)

    # Apply the score impact to the seeker's live Trust Score — this is
    # the feedback loop: repayment behavior changes future creditworthiness.
    seeker = loan.seeker
    seeker.trust_score = max(0, min(900, seeker.trust_score + score_impact))

    # Move the loan into "repaying" once its first EMI is recorded.
    if loan.status == LoanStatus.disbursed:
        loan.status = LoanStatus.repaying

    db.commit()
    db.refresh(event)
    return RepaymentEventItem.model_validate(event)
