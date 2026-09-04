from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.lender import LenderOfficer
from app.schemas.auth import (
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    TokenResponse,
    OfficerMe,
)
from app.services.otp_service import create_otp_request, verify_otp
from app.utils.security import create_access_token
from app.dependencies.auth import get_current_officer

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/send-otp", response_model=SendOtpResponse)
def send_otp(payload: SendOtpRequest, db: Session = Depends(get_db)):
    officer = (
        db.query(LenderOfficer)
        .filter(LenderOfficer.phone_or_email == payload.identifier)
        .first()
    )
    if not officer or not officer.is_active:
        # Intentionally vague to avoid leaking which identifiers exist.
        raise HTTPException(status_code=404, detail="No active officer account found")

    _, otp = create_otp_request(db, payload.identifier)

    return SendOtpResponse(
        message="OTP sent" if not settings.OTP_DEV_MODE else "OTP generated (dev mode)",
        expires_in_seconds=settings.OTP_EXPIRE_SECONDS,
        debug_otp=otp if settings.OTP_DEV_MODE else None,
    )


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp_route(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    if not verify_otp(db, payload.identifier, payload.otp):
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
    # Stateless JWT: logout is handled client-side by discarding the
    # token. Endpoint kept for a clean API surface / future blacklisting.
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
