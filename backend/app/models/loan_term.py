from datetime import date
from sqlalchemy import Column, String, Integer, Numeric, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import UUIDColumn, gen_uuid
from app.models.enums import ScoreTier


class LoanTerm(Base):
    """A lender's rate band for a given score tier. Editing/expiring a
    rate band never rewrites historical loans — Loan.interest_rate is
    locked at disbursement time (see Loan model)."""

    __tablename__ = "loan_terms"

    id = UUIDColumn(primary_key=True, default=gen_uuid)
    lender_id = Column(String(36), ForeignKey("lenders.id"), nullable=False)

    score_tier = Column(Enum(ScoreTier), nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)
    tenure_months = Column(Integer, nullable=False)
    processing_fee = Column(Numeric(10, 2), nullable=False, default=0)

    effective_date = Column(Date, nullable=False, default=date.today)
    expired_date = Column(Date, nullable=True)  # null = currently active

    lender = relationship("Lender", back_populates="loan_terms")

    @property
    def is_active(self) -> bool:
        return self.expired_date is None
