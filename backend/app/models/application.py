from datetime import datetime
from sqlalchemy import Column, String, Integer, Numeric, JSON, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import UUIDColumn, gen_uuid
from app.models.enums import ApplicationStatus


class Application(Base):
    __tablename__ = "applications"

    id = UUIDColumn(primary_key=True, default=gen_uuid)
    seeker_id = Column(String(36), ForeignKey("seekers.id"), nullable=False)
    lender_id = Column(String(36), ForeignKey("lenders.id"), nullable=False)

    requested_amount = Column(Numeric(12, 2), nullable=False)
    loan_type = Column(String, nullable=False)

    # Snapshotted at creation time — the seeker's live score can move on,
    # but the lender's decision must stay auditable against what they saw.
    trust_score_snapshot = Column(Integer, nullable=False)
    score_factors_snapshot = Column(JSON, nullable=False)

    status = Column(Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.pending)

    counter_amount = Column(Numeric(12, 2), nullable=True)
    counter_rate = Column(Numeric(5, 2), nullable=True)
    counter_tenure_months = Column(Integer, nullable=True)
    rejection_reason = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)

    seeker = relationship("Seeker", back_populates="applications")
    lender = relationship("Lender", back_populates="applications")
    loan = relationship("Loan", back_populates="application", uselist=False)
