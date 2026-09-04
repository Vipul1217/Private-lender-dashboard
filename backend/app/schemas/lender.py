from typing import Optional
from decimal import Decimal
from datetime import date
from pydantic import BaseModel


class LoanTermItem(BaseModel):
    id: str
    score_tier: str
    interest_rate: Decimal
    tenure_months: int
    processing_fee: Decimal
    effective_date: date
    expired_date: Optional[date] = None
    is_active: bool

    class Config:
        from_attributes = True


class LoanTermCreate(BaseModel):
    score_tier: str
    interest_rate: Decimal
    tenure_months: int
    processing_fee: Decimal = Decimal("0")


class LoanTermUpdate(BaseModel):
    interest_rate: Optional[Decimal] = None
    tenure_months: Optional[int] = None
    processing_fee: Optional[Decimal] = None


class LenderProfile(BaseModel):
    id: str
    name: str
    type: str
    max_loan_amount: Decimal
    registered_date: date
    active_officer_count: int

    class Config:
        from_attributes = True


class LenderProfileUpdate(BaseModel):
    name: Optional[str] = None
    max_loan_amount: Optional[Decimal] = None


class OfficerItem(BaseModel):
    id: str
    name: str
    role: str
    phone_or_email: str
    is_active: bool

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    pending_applications: int
    active_loans: int
    total_disbursed: Decimal
    repayment_on_time_pct: float


class ApplicationStats(BaseModel):
    pending: int
    countered: int
    approved: int
    rejected: int
    over_time: list[dict]  # [{"date": "2026-08-01", "count": 3}, ...]


class LoanStats(BaseModel):
    approved: int
    disbursed: int
    repaying: int
    closed: int


class RepaymentStats(BaseModel):
    on_time_pct: float
    late_pct: float
    missed_pct: float
    total_emis: int
