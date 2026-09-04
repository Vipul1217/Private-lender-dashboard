# Private Lender Dashboard — SIH Trust Score Platform

A private-lender (MFI/NBFC/SFB) dashboard built on top of a shared,
explainable "Trust Score" credit-scoring infrastructure. Lenders review
applicants' scores and factor breakdowns, approve/counter/reject
applications, disburse and monitor loans, and record repayments that
feed back into the applicant's Trust Score.

```
private-lender-dashboard/
├── backend/     FastAPI + SQLAlchemy + SQLite (default) / PostgreSQL
├── frontend/    React + Vite + Tailwind
├── docker-compose.yml   optional Postgres service
└── README.md    (this file)
```

## Quick start (fastest path — SQLite, no Docker needed)

```bash
# Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python seed.py
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:5173**, sign in with any identifier printed by
`seed.py` (e.g. `admin@sahyogmicrofinance.demo`), and use the `debug_otp`
shown on screen (dev-mode OTP — see `backend/README.md`).

Full details, including running against real PostgreSQL via
`docker-compose.yml`, are in `backend/README.md` and `frontend/README.md`.

## Demo journey

```
Login with OTP → Dashboard → Open pending application → See Trust Score
→ See 6-factor breakdown → Review financial profile → Approve / Counter /
Reject → Loan created → Open loan → Disburse → Record repayment →
See repayment event → See score impact
```

## Product principles this implementation follows

1. The Trust Score is explainable — every factor has a score, a weight,
   and a plain-language explanation, always visible on the review screen.
2. The score informs risk assessment; it does **not** set the interest
   rate. Lenders configure their own rate bands (Rate Bands page) and
   can approve at those rates, or counter-offer with different terms.
3. Successful/late/missed repayments feed back into the seeker's Trust
   Score via a small, transparent, backend-only rule
   (`backend/app/services/score_service.py`).
4. Each lender fully controls its own rate bands; editing a band never
   rewrites the rate on already-disbursed loans (those are locked at
   disbursement).
5. Lender data is strictly isolated — enforced server-side via
   `get_current_officer`, never via the client-supplied `lender_id`.
6. This dashboard is separate from, but designed to later connect to,
   the existing Loan Seeker / Government Dashboard — see the note in
   `backend/app/models/seeker.py`.
7. Monetization/billing (the ₹20 verification fee) is intentionally
   **out of scope** for this MVP.

## What's verified

- Backend imports cleanly and exposes 30+ routes.
- Seed script produces 3 lenders, 14 seekers, 12+ applications across
  all statuses, 6+ loans across all lifecycle stages, 20+ repayment
  events.
- End-to-end tested via live API calls: OTP login → JWT → tenant-scoped
  application list → cross-tenant direct-ID access correctly returns
  404 → approve → loan created → disburse → repayment recorded → score
  impact applied → loan auto-transitions to "repaying".
- Admin-only rate band creation correctly rejects non-admin officers
  with 403.
- Frontend builds cleanly with Vite (`npm run build`) and serves without
  errors.
