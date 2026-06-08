# RotaPro Workforce

A proper workforce rota app foundation for staff scheduling, clocking, breaks, holiday requests, availability, timesheets, reports, and manager approvals.

This is the replacement direction for the earlier local-only rota prototype.

## Current branch

`rota-full-stack-v1`

## Run locally

```bash
npm install
npm run dev
```

## Current features in this branch

- React/Vite app structure
- Mobile-first staff dashboard
- Admin/staff role switching for prototype testing
- Weekly rota view
- Admin rota builder
- People/user profiles
- Manager users included by default:
  - Vikki Fox
  - Chip Butt
  - Rhiannon Green
- Sections and locations
- Clock in/out
- Paid and unpaid break recording
- Timesheet summaries
- Holiday allowance on user profiles
- Paid holiday allowance requests
- Unpaid time-off requests
- Manager approval/rejection flow
- Availability submissions
- Reports scaffold
- Firebase configuration scaffold
- Data model and roadmap docs

## Firebase setup

Create a `.env` file using these variables:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

The app currently runs with local demo data. Firebase wiring is scaffolded in `src/firebase.js` and documented in `DATA_MODEL.md`.

## Important

This app uses a workforce-management feature benchmark, but it must not copy any competitor branding, protected UI, wording, or layout. The app should remain its own original product.
