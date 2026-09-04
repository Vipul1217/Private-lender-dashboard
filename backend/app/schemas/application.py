from typing import Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.seeker import FinancialProfile


class ApplicationListItem(BaseModel):
    id: str
    applicant_name: str
    trust_score_snapshot: int
    score_tier: str
    requested_amount: Decimal
    loan_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationDetail(ApplicationListItem):
    seeker_id: str
    score_factors_snapshot: Dict[str, Any]
    financial_profile: FinancialProfile
    counter_amount: Optional[Decimal] = None
    counter_rate: Optional[Decimal] = None
    counter_tenure_months: Optional[int] = None
    rejection_reason: Optional[str] = None
    decided_at: Optional[datetime] = None
    reference_rate_bands: list[dict] = Field(default_factory=list)


class ApproveRequest(BaseModel):
    loan_amount: Decimal
    interest_rate: Decimal
    tenure_months: int
    processing_fee: Decimal = Decimal("0")


class CounterOfferRequest(BaseModel):
    counter_amount: Decimal
    counter_rate: Decimal
    counter_tenure_months: int


class RejectRequest(BaseModel):
    reason: str
