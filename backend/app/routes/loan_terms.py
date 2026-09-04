from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.lender import LenderOfficer
from app.models.loan_term import LoanTerm
from app.models.enums import ScoreTier
from app.schemas.lender import LoanTermItem, LoanTermCreate, LoanTermUpdate
from app.dependencies.auth import get_current_officer, require_admin

router = APIRouter(prefix="/loan-terms", tags=["loan-terms"])


@router.get("", response_model=list[LoanTermItem])
def list_loan_terms(
    db: Session = Depends(get_db), officer: LenderOfficer = Depends(get_current_officer)
):
    terms = (
        db.query(LoanTerm)
        .filter(LoanTerm.lender_id == officer.lender_id)
        .order_by(LoanTerm.score_tier, LoanTerm.effective_date.desc())
        .all()
    )
    return [LoanTermItem.model_validate(t) for t in terms]


@router.post("", response_model=LoanTermItem)
def create_loan_term(
    payload: LoanTermCreate,
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(require_admin),
):
    try:
        tier = ScoreTier(payload.score_tier)
    except ValueError:
        raise HTTPException(status_code=400, detail="score_tier must be Building, Silver, or Gold")

    term = LoanTerm(
        lender_id=officer.lender_id,
        score_tier=tier,
        interest_rate=payload.interest_rate,
        tenure_months=payload.tenure_months,
        processing_fee=payload.processing_fee,
        effective_date=date.today(),
    )
    db.add(term)
    db.commit()
    db.refresh(term)
    return LoanTermItem.model_validate(term)


@router.put("/{term_id}", response_model=LoanTermItem)
def update_loan_term(
    term_id: str,
    payload: LoanTermUpdate,
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(require_admin),
):
    """Editing an ACTIVE rate band updates it directly (it hasn't been
    used to disburse a loan with a different rate — loans lock their own
    rate at disbursement, see Loan.interest_rate). Historical/expired
    LoanTerm rows are never touched by this endpoint."""
    term = (
        db.query(LoanTerm)
        .filter(LoanTerm.id == term_id, LoanTerm.lender_id == officer.lender_id)
        .first()
    )
    if not term:
        raise HTTPException(status_code=404, detail="Rate band not found")
    if term.expired_date is not None:
        raise HTTPException(status_code=400, detail="Cannot edit an expired rate band")

    if payload.interest_rate is not None:
        term.interest_rate = payload.interest_rate
    if payload.tenure_months is not None:
        term.tenure_months = payload.tenure_months
    if payload.processing_fee is not None:
        term.processing_fee = payload.processing_fee

    db.commit()
    db.refresh(term)
    return LoanTermItem.model_validate(term)


@router.post("/{term_id}/expire", response_model=LoanTermItem)
def expire_loan_term(
    term_id: str,
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(require_admin),
):
    term = (
        db.query(LoanTerm)
        .filter(LoanTerm.id == term_id, LoanTerm.lender_id == officer.lender_id)
        .first()
    )
    if not term:
        raise HTTPException(status_code=404, detail="Rate band not found")

    term.expired_date = date.today()
    db.commit()
    db.refresh(term)
    return LoanTermItem.model_validate(term)
