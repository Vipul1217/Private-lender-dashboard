# Private Lender Dashboard — Frontend

React + Vite + Tailwind frontend for the Trust Score private lender
dashboard.

## Prerequisites

- Node.js 18+
- The backend running (see `../backend/README.md`) — default expected at
  `http://localhost:8000`

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

The app runs at **http://localhost:5173** by default and talks to the
backend at the URL in `VITE_API_BASE_URL` (`.env`).

## Build for production

```bash
npm run build
npm run preview   # serve the production build locally
```

## Structure

- `src/pages/` — one file per screen (Login, Dashboard, Applications,
  ApplicationReview, Loans, LoanDetail, Repayments, RateBands,
  LenderProfile, Settings)
- `src/components/` — shared UI (Sidebar, Topbar, Modal, Badge, KPI
  cards, ProtectedRoute)
- `src/context/` — `AuthContext` (officer session, JWT) and
  `ToastContext` (notifications)
- `src/services/` — Axios client (`api.js`, attaches the JWT
  automatically) and grouped endpoint calls (`resources.js`)
- `src/utils/format.js` — currency/date formatting, status/tier color
  mapping

All data is fetched live from the backend — there is no static/fake
data in the actual application flow.
