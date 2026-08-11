# Pharma-Exchange — Launch Blockers Sprint · PRD

**Repo:** https://github.com/akikto/Pharma-Exchange
**Working branch:** `feature/bl-04-bl-05-legal-compliance`
**Started:** 2026-01-XX (this session)

## Original problem statement

Launch Blocker Sprint — B2B pharmacy marketplace for Bangladesh needs to be
made production-ready. Six blockers to be implemented **strictly one at a
time** with lint / unit / integration / Playwright / prod-build gates and a
PR + completion report per sprint. User approves each sprint before the next.

1. **BL-01 (Sprint 1)** — Production OTP/SMS provider · MSG91
2. **BL-02 (Sprint 2)** — Production payment gateway · Razorpay
3. **BL-03 & BL-06 (Sprint 3)** — Verify Vercel + PostgreSQL + Firebase Auth + FCM
4. **BL-04 & BL-05 (Sprint 4)** — Privacy Policy + T&C + Play Store compliance
5. **BL-07 (Sprint 5)** — Notifications (FCM push + in-app inbox)
6. **BL-08 (Sprint 6)** — Cart MOQ validation
7. **BL-09 (Sprint 7)** — CI E2E, rate-limit test isolation
8. **BL-10 (Sprint 8)** — Dependency security audit (`npm audit` hardening, `OtpToken` cleanup)

## User choices (confirmed)

- Codebase: existing repo cloned into `/app` (workspace).
- OTP provider: **MSG91**.
- Payment gateway: **Razorpay**.
- Deployment: Vercel + PostgreSQL + Firebase already provisioned; validate,
  fix, document. No new accounts. No fake credentials — document `.env`
  templates when secrets are missing.
- Cadence: **stop after each sprint** for review; PR + completion report per
  sprint.

## Architecture (as-found)

- Monorepo (npm workspaces): `backend/` (Node 20 + Express + TypeScript +
  Prisma + PostgreSQL) and `frontend/` (Vite + React + TypeScript + Zustand
  + Tailwind + PWA).
- Auth: JWT access + refresh, Firebase (optional), OTP.
- E2E: Playwright, four projects (`auth`, `buyer`, `seller`, `admin`).
- CI: GitHub Actions with Postgres service.
- Deployment target: Vercel (frontend) + backend on serverless (Vercel
  functions) or container.

## Sprint 1 · BL-01 status

**COMPLETE** — merged to `main` (per user, pushed directly there once).

- MSG91 REST client, phone registration requires verify-otp, no dev fallback.
- Docs: `docs/BL-01-MSG91.md`, `docs/sprint-reports/sprint-01-bl-01.md`.

## Sprint 2 · BL-02 status

**COMPLETE** — merged to `main`.

## Sprint 3 · BL-03 + BL-06 status

**COMPLETE** — merged to `main`.

## Sprint 4 · BL-04 + BL-05 status

**COMPLETE** — merged to `main`.

- `/privacy-policy` + `/terms-and-conditions` routes (+ `/privacy` and
  `/terms` aliases) served unauthenticated.
- Shared `LegalPage` layout: mobile-first, dark-mode friendly, prints
  cleanly, sets SEO meta on mount, accessible landmarks.
- Legal links in login footer, OTP-login footer, Settings; sign-up
  requires `acceptedTerms` checkbox.
- Compliance doc `docs/PLAY-STORE-COMPLIANCE.md` covers Data Safety,
  User Data Policy, sub-processors, permission rationales.

## Sprints 5–10 status

**COMPLETE** — merged to `main` (see `docs/sprint-reports/` and BL docs).

- **BL-07** — FCM push + in-app notifications (`docs/BL-07-NOTIFICATIONS.md`)
- **BL-08** — Cart MOQ validation (`docs/BL-08-CART-MOQ.md`)
- **BL-09** — Playwright E2E in CI (`docs/BL-09-CI-E2E.md`)
- **BL-10** — Dependency security audit + `OtpToken` schema removal (`docs/BL-10-SECURITY-AUDIT.md`)

## Backlog (in order)

- Production deployment verification (BL-03) and staging hardening.
- Optional: `firebase-admin` v14, `@vercel/node` v4 (out of BL-10 scope).

## Personas

- **Buyer** (retail pharmacy) — searches medicine, places orders.
- **Seller** (verified wholesale/manufacturer pharmacy) — manages inventory,
  fulfils orders.
- **Admin** — verifies pharmacies, moderates disputes.

## Notes for future sprints

- The demo login flow (`demoLogin`) is dev-only (throws in production) — no
  BL-01 changes needed but keep this in mind for BL-03.
- Legacy `OtpToken` Prisma model and table were removed in BL-10 (migration
  `20260805140000_drop_otp_token`). MSG91 handles OTP storage externally.
