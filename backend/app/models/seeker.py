"""
Minimal Seeker model.

This dashboard is designed to later connect to the existing Loan
Seeker / Government Dashboard database. For now it ships a small,
self-contained Seeker table (with a rule-based Trust Score + financial
profile) so the private lender dashboard is fully runnable on its own.
Replace this with a shared-schema reference or a sync job when wiring
the two systems together.
"""
from sqlalchemy import Column, String, Integer, Numeric, JSON
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import UUIDColumn, gen_uuid


class Seeker(Base):
    __tablename__ = "seekers"

    id = UUIDColumn(primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False, unique=True)
    occupation = Column(String, nullable=True)  # e.g. "Street Vendor", "Gig Worker"

    # --- current, live Trust Score (explainable, rule-based) ---
    trust_score = Column(Integer, nullable=False, default=0)
    score_factors = Column(JSON, nullable=False, default=dict)
    # score_factors shape:
    # {
    #   "income_consistency":      {"score": 78, "weight": 0.20, "explanation": "..."},
    #   "transaction_frequency":   {"score": 65, "weight": 0.15, "explanation": "..."},
    #   "inflow_outflow_ratio":    {"score": 82, "weight": 0.20, "explanation": "..."},
    #   "financial_longevity":     {"score": 70, "weight": 0.15, "explanation": "..."},
    #   "payer_diversity":         {"score": 60, "weight": 0.15, "explanation": "..."},
    #   "lean_period_resilience":  {"score": 55, "weight": 0.15, "explanation": "..."}
    # }

    # --- financial profile snapshot shown on the review screen ---
    avg_monthly_inflow = Column(Numeric(12, 2), nullable=False, default=0)
    avg_monthly_outflow = Column(Numeric(12, 2), nullable=False, default=0)
    transaction_frequency_per_month = Column(Integer, nullable=False, default=0)
    active_financial_sources = Column(Integer, nullable=False, default=0)
    financial_history_months = Column(Integer, nullable=False, default=0)

    applications = relationship("Application", back_populates="seeker")
    loans = relationship("Loan", back_populates="seeker")

    @property
    def score_tier(self) -> str:
        if self.trust_score >= 750:
            return "Gold"
        if self.trust_score >= 600:
            return "Silver"
        return "Building"
