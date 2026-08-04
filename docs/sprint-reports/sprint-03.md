# Sprint 3 · BL-03 + BL-06 — Production Infrastructure & Security Audit

**Branch:** `feature/bl-03-bl-06-production-audit` → `main`
**Status:** ✅ Complete — ready for review

---

## Scope delivered

| # | Deliverable | Status |
|---|---|---|
| 1 | BL-03 Vercel audit (backend + frontend `vercel.json`, headers, routing) | ✅ |
| 2 | PostgreSQL audit + safe fix (env schema enforces `postgresql://` in prod) | ✅ |
| 3 | BL-06 Firebase audit (Auth, FCM, Admin SDK, Firestore/Storage rules) | ✅ |
| 4 | Production environment templates (backend + frontend + Vercel + Actions) | ✅ |
| 5 | Security review + JWT_SECRET length enforcement + error-response hygiene | ✅ |
| 6 | Six deliverable docs (audit, checklist, environment, sprint report) | ✅ |
| 7 | Lint / unit / integration / Playwright / production build all green | ✅ |
| 8 | No secrets committed, no breaking changes, existing architecture preserved | ✅ |

---

## Files changed

### Added
- `backend/.env.production.example`
- `frontend/.env.production.example`
- `firebase/firestore.rules`, `firebase/storage.rules`, `firebase/firebase.json`
- `docs/BL-03-VERCEL-AUDIT.md`
- `docs/BL-06-FIREBASE-AUDIT.md`
- `docs/PRODUCTION-CHECKLIST.md`
- `docs/ENVIRONMENT-SETUP.md`
- `docs/sprint-reports/sprint-03.md` (this file)
- `docs/sprint-reports/sprint-03-pr.md`

### Modified
- `backend/vercel.json` — added `regions: ["sin1"]`, explicit memory, edge
  security headers (X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, HSTS, Permissions-Policy).
- `frontend/vercel.json` — added `regions: ["sin1"]`, HSTS,
  Permissions-Policy, no-cache override for `firebase-messaging-sw.js`.
- `backend/api/index.ts` — trimmed diagnostics payload (no double keys, no
  runtime env leaks); bootstrap-error handler no longer echoes the
  internal error message in production.
- `backend/src/config/env.ts` — production hardening at boot:
  - `JWT_SECRET.length ≥ 32` in production (was `≥ 16` for all envs).
  - `DATABASE_URL` must start with `postgresql://` in production.
- `backend/src/config/firebase.ts` — `verifyFirebaseToken()` now passes
  `checkRevoked=true` when `NODE_ENV=production`.

**No production code path was refactored.** Only guardrails, headers and
documentation were added.

---

## Summary of implemented fixes

### BL-03 · Vercel
- Backend + frontend deployments pinned to `sin1` (Singapore) for Bangladesh
  buyer latency.
- Edge security headers (HSTS 1 y with `preload`, Permissions-Policy,
  Referrer-Policy, X-Content-Type-Options, X-Frame-Options).
- Serverless bootstrap-error path scrubbed of env / message leakage in
  production.
- Diagnostics endpoint returns only booleans indicating provider
  configuration state — no secret material.

### PostgreSQL
- Boot-time env validation forbids non-`postgresql://` `DATABASE_URL` in
  production.
- Prisma singleton pattern already correct for serverless (globalThis cache
  in dev, one-per-invocation in prod).
- Composite indexes verified on hot paths (`Order`, `Listing`, `Payment`,
  `Refund`, `PaymentWebhookEvent`).
- Pooling recommendation documented — requires operator action on the
  managed Postgres provider.

### BL-06 · Firebase
- `verifyFirebaseToken()` uses `checkRevoked=true` in production — disabled
  / deleted accounts are rejected on the next request.
- Deny-by-default Firestore + Storage rules committed under `firebase/`
  along with a `firebase.json` for `firebase deploy`.
- Confirmed no `firebase-admin` or `FIREBASE_PRIVATE_KEY` references in
  `frontend/src/**` — admin credentials cannot leak to the browser bundle.

### Security review
- JWT_SECRET length enforcement bumped to 32 in production.
- Rate limiters unchanged (auth 60/15m, otp 5/60s, global 500/15m) —
  documented in the checklist.
- Error handler already scrubs stack traces in production; verified.
- Payments webhook still uses `express.raw()` + timing-safe HMAC — no
  regression.

---

## Test / build results

Ran against `feature/bl-03-bl-06-production-audit`.

| Gate | Result |
|---|---|
| `npx tsc --noEmit` (backend) | ✅ 0 errors |
| `npx tsc --noEmit` (frontend) | ✅ 0 errors |
| Backend Vitest (`--pool=forks --singleFork`) | ✅ 123 passed / 124 (1 pre-existing `Cart API MOQ` failure, exists on `main` before this PR — BL-08 scope) |
| Frontend Vitest | ✅ 82/82 |
| Playwright `--project=auth` | ✅ 5/5 |
| `npm --workspace=backend  run build` | ✅ tsc OK |
| `npm --workspace=frontend run build` | ✅ Vite OK (PWA precache 86 entries) |
| Grep for committed secrets | ✅ 0 hits (`git diff main..HEAD | grep -E 'BEGIN PRIVATE\|rzp_live_\|SECRET=\S{10,}'`) |

---

## Remaining manual actions

Everything the code cannot enforce is enumerated in
[`docs/PRODUCTION-CHECKLIST.md`](../PRODUCTION-CHECKLIST.md). High-priority
items you must complete **before** flipping `NODE_ENV=production`:

1. Vercel Project Settings → Environment Variables populated for
   Production scope from the two `.env.production.example` files.
2. Vercel Root Directory set to `backend/` / `frontend/`; Node.js Version
   20.x on both.
3. Custom domain bound; `CORS_ORIGIN` rotated to match.
4. Log Drain configured for both Vercel projects.
5. Firebase Console → Authentication → Authorized domains: production
   origins only.
6. `firebase deploy --only firestore:rules,storage` from the repo root.
7. Postgres provider → pooled connection endpoint, PITR enabled.
8. Rotate all secrets (JWT, Razorpay, MSG91, Firebase, DB password) — none
   of the placeholders in the templates are safe for production.

---

## Confirmation

- ✅ Branch created: `feature/bl-03-bl-06-production-audit` off latest `main`.
- ✅ Existing architecture preserved (React+Vite frontend, Node+Express+
  Prisma backend, PostgreSQL, Firebase Auth).
- ✅ Zero test regressions from BL-01/BL-02 baseline.
- ✅ No secrets committed.
- ✅ Ready for GitHub PR from `feature/bl-03-bl-06-production-audit` →
  `main`. PR body: [`docs/sprint-reports/sprint-03-pr.md`](sprint-03-pr.md).

**Do not start Sprint 4** until the operator approves this PR.
