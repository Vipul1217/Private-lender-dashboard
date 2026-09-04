from typing import Optional
from decimal import Decimal
from datetime import date, datetime
from pydantic import BaseModel


class LoanListItem(BaseModel):
    id: str
    applicant_name: str
    principal_amount: Decimal
    interest_rate: Decimal
    tenure_months: int
    status: str
    disbursed_date: Optional[date] = None
    repayment_status_summary: str  # e.g. "2 on time, 1 due soon"

    class Config:
        from_attributes = True


class RepaymentEventItem(BaseModel):
    id: str
    emi_amount: Decimal
    due_date: date
    paid_date: Optional[date] = None
    status: str
    score_impact: int

    class Config:
        from_attributes = True


class LoanDetail(LoanListItem):
    application_id: str
    seeker_id: str
    processing_fee: Decimal
    closed_date: Optional[date] = None
    repayment_events: list[RepaymentEventItem] = []


class RecordRepaymentRequest(BaseModel):
    emi_amount: Decimal
    due_date: date
    paid_date: Optional[date] = None
    status: str  # on_time | late | missed


class RepaymentTableRow(BaseModel):
    id: str
    applicant_name: str
    loan_id: str
    emi_amount: Decimal
    due_date: date
    paid_date: Optional[date] = None
    status: str
    score_impact: int
    created_at: datetime

    class Config:
        from_attributes = True
