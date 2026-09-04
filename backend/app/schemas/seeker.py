from typing import Dict, Any
from decimal import Decimal
from pydantic import BaseModel


class SeekerSummary(BaseModel):
    id: str
    name: str
    occupation: str | None
    trust_score: int
    score_tier: str

    class Config:
        from_attributes = True


class FinancialProfile(BaseModel):
    avg_monthly_inflow: Decimal
    avg_monthly_outflow: Decimal
    avg_monthly_surplus: Decimal
    transaction_frequency_per_month: int
    active_financial_sources: int
    financial_history_months: int


class SeekerDetail(SeekerSummary):
    score_factors: Dict[str, Any]
    financial_profile: FinancialProfile
