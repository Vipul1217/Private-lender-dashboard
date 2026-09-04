"""
Score feedback rule.

This is the ONLY place the repayment -> Trust Score impact rule is
defined. It is intentionally simple and transparent for the MVP/demo:

    on_time -> +SCORE_IMPACT_ON_TIME  (default +5)
    late    -> +SCORE_IMPACT_LATE     (default -2)
    missed  -> +SCORE_IMPACT_MISSED   (default -5)

The rule lives in the backend (app/config.py) rather than the frontend
so the frontend never has to know or duplicate scoring logic — it just
displays whatever score_impact the backend computed and stored on the
RepaymentEvent.
"""
from app.config import settings
from app.models.enums import RepaymentStatus


def compute_score_impact(status: str) -> int:
    mapping = {
        RepaymentStatus.on_time.value: settings.SCORE_IMPACT_ON_TIME,
        RepaymentStatus.late.value: settings.SCORE_IMPACT_LATE,
        RepaymentStatus.missed.value: settings.SCORE_IMPACT_MISSED,
    }
    return mapping.get(status, 0)


def score_tier_from_score(score: int) -> str:
    if score >= 750:
        return "Gold"
    if score >= 600:
        return "Silver"
    return "Building"
