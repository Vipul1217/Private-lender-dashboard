from datetime import datetime
from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import UUIDColumn, gen_uuid
from app.models.enums import RepaymentStatus


class RepaymentEvent(Base):
    __tablename__ = "repayment_events"

    id = UUIDColumn(primary_key=True, default=gen_uuid)
    loan_id = Column(String(36), ForeignKey("loans.id"), nullable=False)
    seeker_id = Column(String(36), ForeignKey("seekers.id"), nullable=False)

    emi_amount = Column(Numeric(12, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    paid_date = Column(Date, nullable=True)

    status = Column(Enum(RepaymentStatus), nullable=False)
    # signed integer — audit trail of how this event affected the Trust
    # Score. The rule that produces this value lives in
    # app/services/score_service.py, not in the frontend.
    score_impact = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    loan = relationship("Loan", back_populates="repayment_events")
