from typing import Optional
from pydantic import BaseModel


class SendOtpRequest(BaseModel):
    identifier: str  # phone or email


class SendOtpResponse(BaseModel):
    message: str
    expires_in_seconds: int
    # Only populated when OTP_DEV_MODE=true. Documented clearly in README —
    # never enabled in a real deployment.
    debug_otp: Optional[str] = None


class VerifyOtpRequest(BaseModel):
    identifier: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OfficerMe(BaseModel):
    id: str
    name: str
    role: str
    phone_or_email: str
    lender_id: str
    lender_name: str

    class Config:
        from_attributes = True
