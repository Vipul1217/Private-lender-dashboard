from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean

from app.database import Base
from app.models.base import UUIDColumn, gen_uuid


class OtpRequest(Base):
    """Stores a hashed OTP + expiry per login attempt. Never stores the
    plaintext OTP. See app/services/otp_service.py for generation/
    verification logic and app/config.py for OTP_DEV_MODE behavior."""

    __tablename__ = "otp_requests"

    id = UUIDColumn(primary_key=True, default=gen_uuid)
    identifier = Column(String, nullable=False, index=True)  # phone or email
    otp_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    consumed = Column(Boolean, nullable=False, default=False)
    attempt_count = Column(String, nullable=False, default="0")
    created_at = Column(DateTime, default=datetime.utcnow)
