"""
Seed the database with realistic demo data.

Run with:  python seed.py   (from the backend/ directory, venv active)

Creates:
  - 3 lenders (1 MFI, 1 NBFC, 1 SFB), each with its own officers and rate
    bands — used to demonstrate tenant isolation (Officer at Lender A
    logs in -> only sees Lender A's applicants/loans/data).
  - ~12 seekers with varied Trust Scores / factor breakdowns.
  - 12 applications spread across lenders and statuses.
  - 6 loans in different lifecycle states.
  - 24 repayment events, mixed on_time / late / missed.

Demo OTP login: since OTP_DEV_MODE=true by default, call
POST /auth/send-otp with any officer's phone_or_email printed below, and
read the OTP from the API response (or backend console).
"""
import random
from datetime import date, timedelta, datetime

from app.database import SessionLocal, engine, Base
from app import models  # noqa: F401
from app.models.lender import Lender, LenderOfficer
from app.models.loan_term import LoanTerm
from app.models.seeker import Seeker
from app.models.application import Application
from app.models.loan import Loan
from app.models.repayment_event import RepaymentEvent
from app.models.enums import (
    LenderType,
    OfficerRole,
    ScoreTier,
    ApplicationStatus,
    LoanStatus,
    RepaymentStatus,
)
from app.services.score_service import score_tier_from_score, compute_score_impact

random.seed(42)

FACTOR_KEYS = [
    ("income_consistency", "Income Consistency", 0.20),
    ("transaction_frequency", "Transaction Frequency", 0.15),
    ("inflow_outflow_ratio", "Inflow / Outflow Ratio", 0.20),
    ("financial_longevity", "Financial Longevity", 0.15),
    ("payer_diversity", "Payer Diversity", 0.15),
    ("lean_period_resilience", "Lean-period Resilience", 0.15),
]

EXPLANATIONS = {
    "income_consistency": "How steady the applicant's income has been month to month.",
    "transaction_frequency": "How often the applicant transacts, indicating active economic activity.",
    "inflow_outflow_ratio": "Ratio of money coming in versus going out, showing surplus capacity.",
    "financial_longevity": "How long a financial history is available for this applicant.",
    "payer_diversity": "Number of distinct sources of income, reducing single-payer risk.",
    "lean_period_resilience": "How well the applicant's finances hold up during low-income periods.",
}


def make_score_factors():
    factors = {}
    for key, _label, weight in FACTOR_KEYS:
        score = random.randint(40, 95)
        factors[key] = {
            "score": score,
            "weight": weight,
            "explanation": EXPLANATIONS[key],
        }
    return factors


def weighted_score(factors: dict) -> int:
    raw = sum(f["score"] * f["weight"] for f in factors.values())
    # scale the 0-100 weighted average onto an ~300-900 score band
    return int(300 + (raw / 100) * 600)


def make_seeker(db, name, occupation):
    factors = make_score_factors()
    score = weighted_score(factors)
    seeker = Seeker(
        name=name,
        phone=f"9{random.randint(100000000, 999999999)}",
        occupation=occupation,
        trust_score=score,
        score_factors=factors,
        avg_monthly_inflow=random.randint(12000, 45000),
        avg_monthly_outflow=random.randint(8000, 35000),
        transaction_frequency_per_month=random.randint(15, 90),
        active_financial_sources=random.randint(1, 4),
        financial_history_months=random.randint(6, 48),
    )
    db.add(seeker)
    db.flush()
    return seeker


def make_lender(db, name, ltype, max_amount):
    lender = Lender(name=name, type=ltype, max_loan_amount=max_amount, registered_date=date(2025, 4, 1))
    db.add(lender)
    db.flush()

    # rate bands per tier
    bands = {
        ScoreTier.Gold: (14.0, 24, 500),
        ScoreTier.Silver: (18.0, 18, 750),
        ScoreTier.Building: (22.0, 12, 1000),
    }
    for tier, (rate, tenure, fee) in bands.items():
        db.add(
            LoanTerm(
                lender_id=lender.id,
                score_tier=tier,
                interest_rate=rate,
                tenure_months=tenure,
                processing_fee=fee,
                effective_date=date(2025, 4, 1),
            )
        )

    admin = LenderOfficer(
        name=f"{name} Admin",
        lender_id=lender.id,
        role=OfficerRole.Admin,
        permissions={"can_edit_rate_bands": True, "can_view_analytics": True},
        phone_or_email=f"admin@{name.lower().replace(' ', '')}.demo",
    )
    officer = LenderOfficer(
        name=f"{name} Loan Officer",
        lender_id=lender.id,
        role=OfficerRole.Officer,
        permissions={"can_edit_rate_bands": False, "can_view_analytics": True},
        phone_or_email=f"officer@{name.lower().replace(' ', '')}.demo",
    )
    db.add_all([admin, officer])
    db.flush()
    return lender


def make_application(db, seeker, lender, status, days_ago, loan_type="Working Capital"):
    app = Application(
        seeker_id=seeker.id,
        lender_id=lender.id,
        requested_amount=random.choice([15000, 25000, 40000, 60000, 80000]),
        loan_type=loan_type,
        trust_score_snapshot=seeker.trust_score,
        score_factors_snapshot=seeker.score_factors,
        status=status,
        created_at=datetime.utcnow() - timedelta(days=days_ago),
    )
    if status == ApplicationStatus.countered:
        app.counter_amount = float(app.requested_amount) * 0.8
        app.counter_rate = 19.0
        app.counter_tenure_months = 15
    if status == ApplicationStatus.rejected:
        app.rejection_reason = "Insufficient repayment history for requested amount"
        app.decided_at = datetime.utcnow() - timedelta(days=days_ago - 1)
    db.add(app)
    db.flush()
    return app


def make_loan_with_repayments(db, app, num_events, statuses_cycle, loan_status):
    tier = score_tier_from_score(app.trust_score_snapshot)
    rate_map = {"Gold": 15.0, "Silver": 18.5, "Building": 22.0}

    loan = Loan(
        application_id=app.id,
        seeker_id=app.seeker_id,
        lender_id=app.lender_id,
        principal_amount=app.requested_amount,
        interest_rate=rate_map[tier],
        tenure_months=12,
        processing_fee=500,
        status=loan_status,
        disbursed_date=date.today() - timedelta(days=90) if loan_status != LoanStatus.approved else None,
    )
    db.add(loan)
    db.flush()

    seeker = db.query(Seeker).filter(Seeker.id == app.seeker_id).first()
    due = date.today() - timedelta(days=90)
    for i in range(num_events):
        status = statuses_cycle[i % len(statuses_cycle)]
        impact = compute_score_impact(status.value)
        paid_date = due if status != RepaymentStatus.missed else None
        event = RepaymentEvent(
            loan_id=loan.id,
            seeker_id=app.seeker_id,
            emi_amount=round(float(app.requested_amount) / 12, 2),
            due_date=due,
            paid_date=paid_date,
            status=status,
            score_impact=impact,
        )
        db.add(event)
        seeker.trust_score = max(0, min(900, seeker.trust_score + impact))
        due = due + timedelta(days=30)

    if loan_status == LoanStatus.closed:
        loan.closed_date = due

    db.flush()
    return loan


def run():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding lenders...")
        mfi = make_lender(db, "Sahyog Microfinance", LenderType.MFI, 100000)
        nbfc = make_lender(db, "Bharat Growth NBFC", LenderType.NBFC, 500000)
        sfb = make_lender(db, "Unnati Small Finance Bank", LenderType.SFB, 1000000)

        print("Seeding seekers...")
        occupations = ["Street Vendor", "Gig Worker", "Small Shopkeeper", "Auto Driver", "Tailor", "Home-based Cook"]
        seekers = [
            make_seeker(db, name, random.choice(occupations))
            for name in [
                "Rekha Sharma", "Mohammed Iqbal", "Priya Nair", "Suresh Yadav",
                "Anjali Devi", "Ramesh Kumar", "Fatima Begum", "Vikram Singh",
                "Lakshmi Reddy", "Arun Prasad", "Sunita Devi", "Karan Mehta",
            ]
        ]

        print("Seeding applications, loans, and repayments...")
        # Lender A (MFI): mix of pending/countered/approved/rejected
        a1 = make_application(db, seekers[0], mfi, ApplicationStatus.pending, 1)
        a2 = make_application(db, seekers[1], mfi, ApplicationStatus.pending, 3)
        a3 = make_application(db, seekers[2], mfi, ApplicationStatus.countered, 5)
        a4 = make_application(db, seekers[3], mfi, ApplicationStatus.approved, 20)
        a5 = make_application(db, seekers[4], mfi, ApplicationStatus.rejected, 10)

        # Lender B (NBFC)
        b1 = make_application(db, seekers[5], nbfc, ApplicationStatus.pending, 2)
        b2 = make_application(db, seekers[6], nbfc, ApplicationStatus.approved, 60)
        b3 = make_application(db, seekers[7], nbfc, ApplicationStatus.approved, 100)
        b4 = make_application(db, seekers[8], nbfc, ApplicationStatus.countered, 7)

        # Lender C (SFB)
        c1 = make_application(db, seekers[9], sfb, ApplicationStatus.pending, 4)
        c2 = make_application(db, seekers[10], sfb, ApplicationStatus.approved, 45)
        c3 = make_application(db, seekers[11], sfb, ApplicationStatus.rejected, 15)

        # Loans (only for approved applications) across different lifecycle stages
        make_loan_with_repayments(
            db, a4, num_events=3,
            statuses_cycle=[RepaymentStatus.on_time, RepaymentStatus.on_time, RepaymentStatus.late],
            loan_status=LoanStatus.repaying,
        )
        make_loan_with_repayments(
            db, b2, num_events=6,
            statuses_cycle=[RepaymentStatus.on_time, RepaymentStatus.late, RepaymentStatus.on_time,
                            RepaymentStatus.on_time, RepaymentStatus.missed, RepaymentStatus.on_time],
            loan_status=LoanStatus.repaying,
        )
        make_loan_with_repayments(
            db, b3, num_events=10,
            statuses_cycle=[RepaymentStatus.on_time] * 8 + [RepaymentStatus.late, RepaymentStatus.on_time],
            loan_status=LoanStatus.closed,
        )
        make_loan_with_repayments(
            db, c2, num_events=4,
            statuses_cycle=[RepaymentStatus.on_time, RepaymentStatus.missed,
                            RepaymentStatus.on_time, RepaymentStatus.on_time],
            loan_status=LoanStatus.repaying,
        )

        # One purely-approved (not yet disbursed) loan to demo the
        # Approved -> Disburse action in Active Loans.
        extra_seeker = make_seeker(db, "Deepak Chauhan", "Small Shopkeeper")
        extra_app = make_application(db, extra_seeker, mfi, ApplicationStatus.approved, 1, "Equipment Purchase")
        approved_only_loan = Loan(
            application_id=extra_app.id,
            seeker_id=extra_app.seeker_id,
            lender_id=extra_app.lender_id,
            principal_amount=extra_app.requested_amount,
            interest_rate=16.0,
            tenure_months=12,
            processing_fee=500,
            status=LoanStatus.approved,
        )
        db.add(approved_only_loan)

        # One more closed loan for variety
        extra_seeker2 = make_seeker(db, "Meena Kumari", "Tailor")
        extra_app2 = make_application(db, extra_seeker2, sfb, ApplicationStatus.approved, 200, "Working Capital")
        make_loan_with_repayments(
            db, extra_app2, num_events=12,
            statuses_cycle=[RepaymentStatus.on_time] * 10 + [RepaymentStatus.late, RepaymentStatus.on_time],
            loan_status=LoanStatus.closed,
        )

        db.commit()

        print("\nSeed complete.\n")
        print("Demo login identifiers (OTP_DEV_MODE=true — OTP is returned by /auth/send-otp):")
        for lender in [mfi, nbfc, sfb]:
            officers = db.query(LenderOfficer).filter(LenderOfficer.lender_id == lender.id).all()
            print(f"\n  {lender.name} ({lender.type.value}):")
            for o in officers:
                print(f"    - {o.role.value:6s} -> {o.phone_or_email}")

        print(
            "\nTenant isolation check: log in as an officer from one lender and "
            "confirm the Applications/Loans lists only ever show that lender's data."
        )
    finally:
        db.close()


if __name__ == "__main__":
    run()
