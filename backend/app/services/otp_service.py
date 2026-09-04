import random
import string
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.models.otp import OtpRequest
from app.utils.hashing import hash_otp


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=settings.OTP_LENGTH))


def create_otp_request(db: Session, identifier: str) -> tuple[OtpRequest, str]:
    """Creates and stores a new (hashed) OTP for this identifier and
    returns (db_record, plaintext_otp). The plaintext is only ever
    returned to the caller to send via SMS/email — it is never
    persisted. In OTP_DEV_MODE the calling route echoes it back in the
    API response for demo purposes; see app/routes/auth.py."""
    otp = generate_otp()
    record = OtpRequest(
        identifier=identifier,
        otp_hash=hash_otp(otp, identifier),
        expires_at=datetime.utcnow() + timedelta(seconds=settings.OTP_EXPIRE_SECONDS),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    if settings.OTP_DEV_MODE:
        print(f"[DEV OTP] identifier={identifier} otp={otp}")

    return record, otp


def verify_otp(db: Session, identifier: str, otp: str) -> bool:
    record = (
        db.query(OtpRequest)
        .filter(OtpRequest.identifier == identifier, OtpRequest.consumed.is_(False))
        .order_by(OtpRequest.created_at.desc())
        .first()
    )
    if not record:
        return False
    if record.expires_at < datetime.utcnow():
        return False
    if record.otp_hash != hash_otp(otp, identifier):
        return False

    record.consumed = True
    db.commit()
    return True
