from sqlalchemy import Column, String, Integer, Numeric, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import UUIDColumn, gen_uuid
from app.models.enums import LoanStatus


class Loan(Base):
    __tablename__ = "loans"

    id = UUIDColumn(primary_key=True, default=gen_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, unique=True)
    seeker_id = Column(String(36), ForeignKey("seekers.id"), nullable=False)
    lender_id = Column(String(36), ForeignKey("lenders.id"), nullable=False)

    principal_amount = Column(Numeric(12, 2), nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)  # locked at disbursement
    tenure_months = Column(Integer, nullable=False)
    processing_fee = Column(Numeric(10, 2), nullable=False, default=0)

    status = Column(Enum(LoanStatus), nullable=False, default=LoanStatus.approved)

    disbursed_date = Column(Date, nullable=True)
    closed_date = Column(Date, nullable=True)

    application = relationship("Application", back_populates="loan")
    seeker = relationship("Seeker", back_populates="loans")
    lender = relationship("Lender", back_populates="loans")
    repayment_events = relationship(
        "RepaymentEvent", back_populates="loan", order_by="RepaymentEvent.due_date"
    )
