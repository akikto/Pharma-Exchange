# Pharma-Exchange — Launch Blockers Sprint · PRD

**Repo:** https://github.com/akikto/Pharma-Exchange
**Working branch:** `feature/bl-01-msg91-otp`
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
5. **BL-07 (Sprint 5)** — Resolve npm audit vulnerabilities
6. **BL-08 (Sprint 6)** — Green Playwright CI (rate-limit + refresh rotation)

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

**COMPLETE** (awaiting user approval to open PR + start Sprint 2)

- MSG91 REST client at `backend/src/shared/services/msg91.service.ts` with
  send / verify / resend.
- Auth service refactored — phone registration requires `verify-otp`; no
  local OTP storage; no dev-mode fallback.
- `.env.example`, docker-compose, CI, README, deployment docs updated.
- Docs: `docs/BL-01-MSG91.md`, `docs/sprint-reports/sprint-01-bl-01.md`.
- Tests: 104 backend + 82 frontend + 5 Playwright (auth) — all green.
- Production build: green for both workspaces.

## Backlog (in order)

- **P0** BL-02: Razorpay checkout, order signing, webhook verification,
  refund/cancel, idempotency.
- **P0** BL-03/BL-06: audit Vercel, Postgres, Firebase Auth, FCM config.
- **P0** BL-04/BL-05: Privacy Policy + T&C pages, link from Settings +
  Login, Play Store metadata.
- **P1** BL-07: `npm audit` clean-up + compatibility verification.
- **P1** BL-08: rate-limiter test isolation + refresh-token rotation tests +
  full Playwright green.

## Personas

- **Buyer** (retail pharmacy) — searches medicine, places orders.
- **Seller** (verified wholesale/manufacturer pharmacy) — manages inventory,
  fulfils orders.
- **Admin** — verifies pharmacies, moderates disputes.

## Notes for future sprints

- The demo login flow (`demoLogin`) is dev-only (throws in production) — no
  BL-01 changes needed but keep this in mind for BL-03.
- `OtpToken` model still exists in Prisma but has no writer post-BL-01;
  drop it in a schema cleanup migration during BL-08 or BL-07.
- Playwright test flake in full-parallel Vitest run is BL-08 scope.
