"""
Central configuration, loaded from environment variables (.env).

IMPORTANT PRODUCT PRINCIPLE (see README): the Trust Score informs risk
assessment but does not itself set the interest rate — lenders set their
own rate bands (see LoanTerm) and can approve/counter/reject freely.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    # --- Database ---
    # Defaults to a local SQLite file so the project runs with zero extra
    # setup. Set DATABASE_URL in .env to point at Postgres (see
    # docker-compose.yml) for a production-like run.
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", f"sqlite:///{BASE_DIR / 'lender_dashboard.db'}"
    )

    # --- JWT ---
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))

    # --- OTP ---
    OTP_LENGTH: int = 6
    OTP_EXPIRE_SECONDS: int = int(os.getenv("OTP_EXPIRE_SECONDS", "300"))
    # Dev mode returns the OTP in the API response + server logs instead of
    # sending a real SMS/email, so the flow can be demoed without an SMS
    # gateway. Never enable this in a real deployment.
    OTP_DEV_MODE: bool = os.getenv("OTP_DEV_MODE", "true").lower() == "true"

    # --- CORS ---
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    # --- Score feedback rule (documented, configurable here — not in the
    # frontend, and not hardcoded inline in route handlers) ---
    SCORE_IMPACT_ON_TIME: int = int(os.getenv("SCORE_IMPACT_ON_TIME", "5"))
    SCORE_IMPACT_LATE: int = int(os.getenv("SCORE_IMPACT_LATE", "-2"))
    SCORE_IMPACT_MISSED: int = int(os.getenv("SCORE_IMPACT_MISSED", "-5"))


settings = Settings()
