# Chip In Loyalty — reusable digital stamp card

A branded customer loyalty web app with Cloudflare Workers + D1. Each company gets its own deployment and D1 database. No required customer accounts or third-party paid QR service for basic operation.

## Setup for a new business
1. Duplicate this repository (GitHub template or copy).
2. Edit `brand.js` for name, colours, reward and font. Replace `public/logo.svg` with the company's logo, and change the `logo` path if necessary.
3. Set `STAMPS_REQUIRED` in the Cloudflare Worker environment to the same integer as `brand.js` (default 8).
4. Create a Cloudflare D1 database named for the business, copy its database ID into `wrangler.jsonc`.
5. Run `npx wrangler d1 execute loyalty --remote --file=./schema.sql` from the project folder (or execute the schema in the D1 dashboard).
6. Set `STAFF_KEY` as a **secret** in Cloudflare (never commit it): `npx wrangler secret put STAFF_KEY`.
7. Deploy via `npx wrangler deploy`. Connect a custom domain in Cloudflare if required.
8. Open the deployed site. Staff dashboard is at `/?staff`. Test join → stamp → reward → redeem on a test card.

## What is included
- Responsive branded customer card, PWA install support, progress display and QR card link
- Staff key protected stamping, redemption, live aggregate dashboard
- D1 persistent data, stamp history, customer identifiers generated without asking for names/emails
- Brand configuration in one file; no customer data shared between deployments
- No stock photos or licensed external artwork needed; included logo is original SVG

## Important before selling
This is an initial functional build, **not a production security certification**. The shared staff key should be replaced with named staff accounts, rate limiting, proper session management and audit controls before real customer use. The current QR uses the external qrserver.com image endpoint, which receives the card token: replace it with a locally generated QR library before production. Protect against card-link sharing, add deletion/retention controls, accessible privacy notice and a backup/restore process. Verify deployment, concurrent stamping, payment/contract terms and Cloudflare quotas. Do not represent it as independently audited.

## Licensing
Original application source is provided for Chip In's own reuse. Fonts loaded from Google Fonts require review of their OFL terms if bundled locally. No third-party photographs are included.
