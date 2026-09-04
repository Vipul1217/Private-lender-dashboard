from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, SessionLocal
from app import models  # noqa: F401

from app.models.lender import LenderOfficer
from app.routes import auth, dashboard, applications, loans, repayments, loan_terms, lender

Base.metadata.create_all(bind=engine)

# Seed demo data automatically on a fresh database.
db = SessionLocal()
try:
    if db.query(LenderOfficer).count() == 0:
        from seed import run
        run()
finally:
    db.close()

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