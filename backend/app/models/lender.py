from datetime import date
from sqlalchemy import Column, String, Numeric, Date, Enum, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import UUIDColumn, gen_uuid
from app.models.enums import LenderType, OfficerRole


class Lender(Base):
    __tablename__ = "lenders"

    id = UUIDColumn(primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    type = Column(Enum(LenderType), nullable=False)
    max_loan_amount = Column(Numeric(12, 2), nullable=False)
    registered_date = Column(Date, nullable=False, default=date.today)

    loan_terms = relationship("LoanTerm", back_populates="lender")
    officers = relationship("LenderOfficer", back_populates="lender")
    applications = relationship("Application", back_populates="lender")
    loans = relationship("Loan", back_populates="lender")


class LenderOfficer(Base):
    __tablename__ = "lender_officers"

    id = UUIDColumn(primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    lender_id = Column(String(36), ForeignKey("lenders.id"), nullable=False)

    role = Column(Enum(OfficerRole), nullable=False, default=OfficerRole.Officer)
    permissions = Column(JSON, nullable=False, default=dict)

    phone_or_email = Column(String, nullable=False, unique=True)
    is_active = Column(Boolean, nullable=False, default=True)

    lender = relationship("Lender", back_populates="officers")
