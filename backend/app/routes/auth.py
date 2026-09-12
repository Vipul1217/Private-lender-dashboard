from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.lender import LenderOfficer
from app.schemas.auth import (
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    TokenResponse,
    OfficerMe,
)
from app.utils.security import create_access_token
from app.dependencies.auth import get_current_officer

router = APIRouter(prefix="/auth", tags=["auth"])

DEMO_OTP = "123456"


@router.post("/send-otp", response_model=SendOtpResponse)
def send_otp(payload: SendOtpRequest, db: Session = Depends(get_db)):
    officer = (
        db.query(LenderOfficer)
        .filter(LenderOfficer.phone_or_email == payload.identifier)
        .first()
    )
    if not officer or not officer.is_active:
        raise HTTPException(status_code=404, detail="No active officer account found")

    return SendOtpResponse(
        message="OTP sent",
        expires_in_seconds=3600,
        debug_otp=DEMO_OTP,
    )


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp_route(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    if payload.otp != DEMO_OTP:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    officer = (
        db.query(LenderOfficer)
        .filter(LenderOfficer.phone_or_email == payload.identifier)
        .first()
    )
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    token = create_access_token(officer.id, officer.lender_id)
    return TokenResponse(access_token=token)


@router.post("/logout")
def logout(officer: LenderOfficer = Depends(get_current_officer)):
    return {"message": "Logged out"}


@router.get("/me", response_model=OfficerMe)
def me(officer: LenderOfficer = Depends(get_current_officer)):
    return OfficerMe(
        id=officer.id,
        name=officer.name,
        role=officer.role.value,
        phone_or_email=officer.phone_or_email,
        lender_id=officer.lender_id,
        lender_name=officer.lender.name,
    )