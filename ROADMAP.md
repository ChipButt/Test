# RotaPro Workforce roadmap

The goal is to cover the same broad operational needs as a modern workforce management platform, without copying any competitor branding, screens, text, or protected design.

## Phase 1 — Proper app foundation
- React/Vite app structure
- Mobile-first staff dashboard
- Weekly rota view
- Admin rota builder
- People profiles
- Sections and locations
- Clock in/out
- Paid and unpaid breaks
- Timesheet summaries
- Holiday allowance on profiles
- Paid holiday and unpaid time-off requests
- Manager approval/rejection flow
- Availability submissions
- Reports scaffold
- Firebase configuration scaffold

## Phase 2 — Real multi-user backend
- Firebase Auth login
- Firestore persistence
- Role-based security rules
- Cloud Functions for notifications
- Push notification token registration
- Email notification fallback
- Audit log persisted to Firestore

## Phase 3 — Workforce management features
- Shift swap requests
- Open shifts that staff can claim
- Manager approval for swaps and claims
- Leave conflict detection
- Availability conflict warnings during scheduling
- Labour cost forecast while building rota
- Scheduled vs actual hours comparison
- Timesheet approval workflow
- Late clock-in and missed clock-out exceptions
- Break compliance warnings
- Staff documents and onboarding checklist
- Announcements and read receipts
- Export to CSV/payroll

## Phase 4 — Polish and production readiness
- Proper design system
- Accessibility pass
- PWA install support
- Offline-safe clock-in queue
- Calendar subscriptions
- Admin bulk actions
- Import/export staff data
- Testing suite
- Deployment workflow

## Notes
This branch is deliberately not a visual clone of Deputy or any other product. The feature set should be competitive and familiar, but the product identity, UI, copy, and interaction details must remain original.
