from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.lender import Lender, LenderOfficer
from app.schemas.lender import LenderProfile, LenderProfileUpdate, OfficerItem
from app.dependencies.auth import get_current_officer, require_admin

router = APIRouter(prefix="/lender", tags=["lender"])


@router.get("/profile", response_model=LenderProfile)
def get_profile(db: Session = Depends(get_db), officer: LenderOfficer = Depends(get_current_officer)):
    lender = db.query(Lender).filter(Lender.id == officer.lender_id).first()
    active_officers = (
        db.query(LenderOfficer)
        .filter(LenderOfficer.lender_id == lender.id, LenderOfficer.is_active.is_(True))
        .count()
    )
    return LenderProfile(
        id=lender.id,
        name=lender.name,
        type=lender.type.value,
        max_loan_amount=lender.max_loan_amount,
        registered_date=lender.registered_date,
        active_officer_count=active_officers,
    )


@router.put("/profile", response_model=LenderProfile)
def update_profile(
    payload: LenderProfileUpdate,
    db: Session = Depends(get_db),
    officer: LenderOfficer = Depends(require_admin),
):
    lender = db.query(Lender).filter(Lender.id == officer.lender_id).first()
    if payload.name is not None:
        lender.name = payload.name
    if payload.max_loan_amount is not None:
        lender.max_loan_amount = payload.max_loan_amount
    db.commit()
    db.refresh(lender)

    active_officers = (
        db.query(LenderOfficer)
        .filter(LenderOfficer.lender_id == lender.id, LenderOfficer.is_active.is_(True))
        .count()
    )
    return LenderProfile(
        id=lender.id,
        name=lender.name,
        type=lender.type.value,
        max_loan_amount=lender.max_loan_amount,
        registered_date=lender.registered_date,
        active_officer_count=active_officers,
    )


@router.get("/officers", response_model=list[OfficerItem])
def list_officers(db: Session = Depends(get_db), officer: LenderOfficer = Depends(get_current_officer)):
    officers = db.query(LenderOfficer).filter(LenderOfficer.lender_id == officer.lender_id).all()
    return [OfficerItem.model_validate(o) for o in officers]
