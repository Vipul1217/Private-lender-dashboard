"""
CRITICAL: this is the single source of truth for "who is calling and
which lender do they belong to". Every lender-scoped route depends on
get_current_officer and MUST filter its queries by
officer.lender_id — never by a lender_id read from the request body or
query params. This is what makes tenant isolation (Lender A can never
see Lender B's data) an enforced backend property instead of a UI
convention.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.lender import LenderOfficer
from app.utils.security import decode_access_token

bearer_scheme = HTTPBearer()


def get_current_officer(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> LenderOfficer:
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    officer = db.query(LenderOfficer).filter(LenderOfficer.id == payload["sub"]).first()
    if not officer or not officer.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Officer not found or inactive",
        )
    return officer


def require_admin(officer: LenderOfficer = Depends(get_current_officer)) -> LenderOfficer:
    if officer.role.value != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required for this action",
        )
    return officer
