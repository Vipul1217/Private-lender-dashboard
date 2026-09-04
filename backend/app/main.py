from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app import models  # noqa: F401 -- registers all models on Base.metadata

from app.routes import auth, dashboard, applications, loans, repayments, loan_terms, lender

# Creates tables if they don't exist yet. For a production Postgres setup
# you'd typically use Alembic migrations instead; this keeps first-run
# local setup (SQLite or fresh Postgres) to a single command.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Private Lender Dashboard API",
    description="Backend for the SIH Trust Score private lender dashboard (MFI/NBFC/SFB).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(applications.router)
app.include_router(loans.router)
app.include_router(repayments.router)
app.include_router(loan_terms.router)
app.include_router(lender.router)


@app.get("/health")
def health():
    return {"status": "ok"}
