# Private Lender Dashboard — Backend

FastAPI + SQLAlchemy backend for the Trust Score private lender dashboard
(MFI/NBFC/SFB). Implements OTP + JWT auth, tenant-isolated multi-lender
data, the application → loan → repayment → score-feedback workflow, and
versioned rate bands.

## 1. Prerequisites

- Python 3.10+
- (Optional) Docker, if you want to run against Postgres instead of SQLite

## 2. Environment variables

```bash
cp .env.example .env
```

By default `DATABASE_URL` is left unset, which makes the app use a local
SQLite file (`lender_dashboard.db`) — this is the fastest way to run the
demo with zero extra setup. To use Postgres instead, uncomment the
`DATABASE_URL` line in `.env` (see step 3).

`OTP_DEV_MODE=true` (the default) makes `/auth/send-otp` return the OTP
directly in its JSON response and print it to the server console, so you
can log in without a real SMS/email provider. **Set this to `false` and
wire up a real provider before any real deployment.**

## 3. (Optional) Start PostgreSQL

From the project root:

```bash
docker compose up -d postgres
```

Then in `backend/.env`, uncomment:

```
DATABASE_URL=postgresql://lender_admin:lender_pass@localhost:5432/lender_dashboard
```

If you skip this step entirely, the app just uses SQLite — no changes needed.

## 4. Install backend dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 5. Run the backend

```bash
uvicorn app.main:app --reload --port 8000
```

Tables are created automatically on first run (`Base.metadata.create_all`).

## 6. Seed the database

In a separate terminal (same venv):

```bash
python seed.py
```

This creates 3 lenders (MFI, NBFC, SFB), officers for each, rate bands,
12+ seekers, 12+ applications across all statuses, 6+ loans in different
lifecycle stages, and 24+ repayment events — mixed on-time/late/missed.
The script prints each officer's login identifier at the end.

## 7. Demo login (OTP flow)

1. `POST /auth/send-otp` with `{"identifier": "admin@sahyogmicrofinance.demo"}`
   (or any identifier printed by `seed.py`).
2. Because `OTP_DEV_MODE=true`, the response includes `debug_otp` — use
   that value.
3. `POST /auth/verify-otp` with the identifier and that OTP to get a JWT.
4. Use `Authorization: Bearer <token>` on all other endpoints.

## 8. API documentation

Once running: **http://localhost:8000/docs** (Swagger UI) or
**http://localhost:8000/redoc**.

## 9. Verifying tenant isolation

Log in as an officer from one lender (e.g. Sahyog Microfinance) and call
`GET /applications` — you should only see that lender's applicants. Log
in as an officer from a different lender (e.g. Bharat Growth NBFC) and
confirm the lists never overlap, and that fetching another lender's
application/loan ID directly returns `404`.

## Notes on design decisions

- **Score feedback rule** lives in `app/services/score_service.py` and
  `app/config.py` (`SCORE_IMPACT_ON_TIME` / `_LATE` / `_MISSED`) — not in
  the frontend — so the scoring logic has a single source of truth.
- **Rate band versioning**: editing an active `LoanTerm` changes that
  band going forward; disbursed `Loan` rows lock their own
  `interest_rate` at disbursement time and are never affected.
- **Multi-tenancy**: every lender-scoped route depends on
  `get_current_officer` (`app/dependencies/auth.py`) and filters by
  `officer.lender_id` — a `lender_id` from the request body/query is
  never trusted.
- **Seeker model**: this dashboard ships a small, self-contained
  `Seeker` table (with a rule-based Trust Score + financial profile) so
  it's runnable on its own. When wiring it to the real Loan Seeker /
  Government Dashboard database, replace `app/models/seeker.py` with a
  shared-schema reference or a sync job.
