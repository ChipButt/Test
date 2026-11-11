# Chip In Loyalty

A reusable loyalty card application built for Cloudflare Workers and D1.

## Status
The source code is not a live service until a D1 database is created, the schema is applied, a staff secret is configured, and a Cloudflare Worker is deployed. GitHub Pages cannot run the backend.

## Brand a new installation
1. Copy this repository into a new repository for the business.
2. Edit `public/brand.js` to set name, tagline, colour palette, reward description and required stamps.
3. Replace `public/logo.svg` with the business logo. Update the logo path in `public/brand.js` if using PNG/WebP.
4. Use a commercially licensed font. The current Google Font is DM Sans (SIL Open Font License).
5. Create a new D1 database and set its ID in `wrangler.jsonc`.
6. Apply `schema.sql` to the D1 database.
7. Configure Cloudflare secret `STAFF_KEY` (at least 16 characters), and `STAMPS_REQUIRED` to match the brand setting.
8. Deploy the Worker with Cloudflare's Wrangler or a CI workflow. Verify the Worker health endpoint and complete a join, stamp and redeem test.

## Operations
Each business must use its own D1 database and staff secret. The staff area is accessed with `/?staff`. Cards are bearer links; anyone with a link can display that card. Customers should be informed of this. Use Cloudflare rate limits and monitor for abuse. Database backups, deletion policies and recovery procedures must be configured before accepting real customers.

## Security and production
This is not independently security audited. The current staff key is shared rather than a per-staff identity. This is a deployment blocker for businesses requiring per-user accountability. No automatic payments, GDPR retention workflow or production backup/restore verification is included. Do not sell this as a fully managed production system without completing those requirements.

## Architecture
- `public/`: customer and staff user interface
- `src/worker.js`: Cloudflare Worker API
- `schema.sql`: D1 schema
- `wrangler.jsonc`: deployment configuration

No third-party stock artwork is included. The original sample logo is an SVG illustration.
