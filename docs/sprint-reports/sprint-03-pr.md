# BL-03 + BL-06: Production infrastructure & security audit

Closes: **BL-03** and **BL-06** (Launch Blockers · Sprint 3)

## Summary

Full audit of the Vercel deployment topology (backend + frontend),
PostgreSQL / Prisma configuration and the entire Firebase surface (Auth,
Admin SDK, FCM, Firestore rules, Storage rules). All safe fixes are
shipped. Everything that requires an operator action in a vendor
dashboard is enumerated in [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md).

## What's in this PR

- **Vercel edge hardening**
  - Backend + frontend `vercel.json` pinned to `sin1` (Singapore).
  - HSTS (1 y, `includeSubDomains`, `preload`), Permissions-Policy,
    Referrer-Policy, X-Content-Type-Options, X-Frame-Options on both
    projects.
  - Explicit function memory + max duration on the backend.
  - No-cache override for `firebase-messaging-sw.js`.
- **Serverless bootstrap**
  - `backend/api/index.ts` diagnostics trimmed to production-safe booleans.
  - Bootstrap-error responses no longer leak internal messages / env in
    production.
- **Env validation (production)**
  - `JWT_SECRET.length ≥ 32` enforced at boot.
  - `DATABASE_URL` must be `postgresql://…`.
  - Failures throw before Express is mounted — the health check turns
    red immediately on mis-config.
- **Firebase**
  - `verifyFirebaseToken()` uses `checkRevoked=true` in production so
    disabled/deleted users are rejected on their next request.
  - Deny-by-default `firebase/firestore.rules` and `firebase/storage.rules`
    added, wired via `firebase/firebase.json` for
    `firebase deploy --only firestore:rules,storage`.
- **Environment templates**
  - `backend/.env.production.example` and
    `frontend/.env.production.example` are the operator-ready copies.
- **Documentation**
  - `docs/BL-03-VERCEL-AUDIT.md`
  - `docs/BL-06-FIREBASE-AUDIT.md`
  - `docs/PRODUCTION-CHECKLIST.md`
  - `docs/ENVIRONMENT-SETUP.md`
  - `docs/sprint-reports/sprint-03.md` (completion report)

## Test evidence

| Gate | Result |
|---|---|
| `tsc --noEmit` (backend + frontend) | ✅ 0 errors |
| Backend Vitest (single-fork) | ✅ 123 passed / 1 pre-existing `Cart API MOQ` failure (BL-08 scope) |
| Frontend Vitest | ✅ 82/82 |
| Playwright `--project=auth` | ✅ 5/5 |
| Backend production build | ✅ |
| Frontend production build | ✅ |
| Secret scan (`git diff main..HEAD`) | ✅ 0 findings |

## Behaviour changes

- Production API responses for the `/health` diagnostics no longer include
  `nodeEnv` twice, and stop reporting `msg91Enabled` / `razorpayEnabled`
  separately from `*Configured` (kept only the aggregate `*Configured`
  boolean). Consumers of the health endpoint should update to read
  `*Configured` if they were parsing the old keys — no known internal
  consumer relies on the removed keys.
- Firebase-authenticated users who have been disabled will start receiving
  `401` on their next request in production (previously the token would be
  accepted until natural expiry).
- Booting the API in production with a short JWT_SECRET or non-Postgres
  DATABASE_URL now fails fast instead of running with a weak config.

## Out of scope

- CSP hardening on the frontend — needs a manual Razorpay + Firebase
  iframe allow-list; documented in `ENVIRONMENT-SETUP.md`.
- Vercel Log Drain / Analytics enablement — dashboard-only.
- Pre-existing `Cart API MOQ` test failure — BL-08 (Sprint 6).

## Deployment notes

Do **not** flip DNS to production until every "Manual" item in
[`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) is ticked.
Notably: pooled Postgres DSN, Vercel Root Directory settings, custom
domains + `CORS_ORIGIN`, Firebase authorized domains and rule deploy.
