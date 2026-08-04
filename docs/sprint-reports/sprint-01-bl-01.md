# Sprint 1 · BL-01 — MSG91 OTP Integration · Completion Report

**Blocker:** BL-01 — Integrate a production-ready OTP/SMS provider
**Provider:** MSG91 (REST v5)
**Branch:** `feature/bl-01-msg91-otp` → `main`
**Status:** ✅ Complete — ready for review

---

## Scope delivered

| # | Deliverable | Status |
|---|---|---|
| 1 | Integrate MSG91 SMS OTP send / verify / resend | ✅ |
| 2 | Remove **all** development OTP behaviour (dev codes, `OTP_DEV_MODE`, `devOtp` response fields, plaintext logging, local `OtpToken` writes) | ✅ |
| 3 | Env-driven production configuration with fail-fast validation | ✅ |
| 4 | `.env.example` updated (backend + root) | ✅ |
| 5 | Setup checklist + operator documentation | ✅ [`docs/BL-01-MSG91.md`](BL-01-MSG91.md) |
| 6 | Backend unit + integration tests for MSG91 and new auth flows | ✅ |
| 7 | Frontend UI stripped of `devOtp` display, wired to new resend endpoint | ✅ |
| 8 | Lint / unit / integration / Playwright / production build all green | ✅ |
| 9 | Docker Compose + GitHub Actions CI env updated | ✅ |

---

## Verification

All commands run against the `feature/bl-01-msg91-otp` branch.

### Lint (`tsc --noEmit`)

```
$ npm --workspace=backend  run lint    →  0 errors
$ npm --workspace=frontend run lint    →  0 errors
```

### Unit + integration tests (Vitest)

Backend — 30 files / **104 tests passing** (single-fork mode; parallel mode
flake is a pre-existing rate-limiter contention issue tracked under **BL-08**,
Sprint 6):

```
Test Files  30 passed (30)
     Tests  104 passed (104)
```

Frontend — 12 files / **82 tests passing**:

```
Test Files  12 passed (12)
     Tests  82 passed (82)
```

Key new/changed suites:

- `backend/tests/msg91.service.test.ts` — 11 tests (send/verify/resend
  happy path, 429/401/5xx/network mapping, phone normalisation).
- `backend/tests/auth.register.test.ts` — 4 tests (email-only issues tokens,
  phone triggers MSG91, error surfacing, no `devOtp` leak).
- `backend/tests/auth.verify-otp.test.ts` — 3 tests (success, invalid code,
  missing phone rejected).

### Playwright E2E (auth project)

```
Running 5 tests using 1 worker
  ✓ 1  buyer login lands on home
  ✓ 2  seller login lands on seller dashboard
  ✓ 3  admin login lands on admin dashboard
  ✓ 4  invalid credentials show error
  ✓ 5  OTP login page loads
  5 passed (37.1s)
```

Only the `auth` project is executed for BL-01; the remaining projects
(`buyer`, `seller`, `admin`) are BL-08 scope (Sprint 6).

### Production build

```
$ npm run build:backend    →  tsc  OK
$ npm run build:frontend   →  Vite build OK  (PWA precache 86 entries, 4354 KiB)
```

### Manual smoke (with `fetch` mocked)

- `POST /auth/register` with email → **201** and tokens; no OTP field.
- `POST /auth/register` with phone → **201** with
  `requiresOtpVerification: true, otpRequestId: "..."`; **no** tokens.
- `POST /auth/verify-otp` with correct code → **200** tokens.
- `POST /auth/verify-otp` with wrong code → **502 OTP_PROVIDER_ERROR**.
- MSG91 outage → **503 OTP_PROVIDER_UNAVAILABLE**, retriable.

---

## Files touched

**Backend (created)**
- `backend/src/shared/services/msg91.service.ts` — MSG91 REST client (send /
  verify / resend, phone normalisation, timeouts, error mapping).
- `backend/tests/msg91.service.test.ts`
- `backend/tests/auth.verify-otp.test.ts`

**Backend (modified)**
- `backend/src/config/env.ts` — added `MSG91_*` schema, dropped `OTP_DEV_MODE`,
  added `isMsg91Configured()`.
- `backend/src/modules/auth/auth.service.ts` — replaced local OTP path with
  MSG91 calls; phone registration now requires verification.
- `backend/src/modules/auth/auth.validation.ts` — phone-only OTP schemas.
- `backend/src/modules/auth/auth.controller.ts`, `auth.routes.ts` — added
  `/auth/resend-otp`.
- `backend/api/index.ts` — diagnostics now report `msg91Enabled` /
  `msg91Configured` instead of `otpDevMode`.
- `backend/tests/setup.ts` — MSG91 test env, `OTP_DEV_MODE` removed.
- `backend/tests/auth.register.test.ts` — rewritten for new behaviour.
- `backend/.env.example` — new MSG91 block.

**Frontend (modified)**
- `frontend/src/stores/auth-store.ts` — removed `devOtp`, added `resendOtp`,
  refined register/verify signatures.
- `frontend/src/features/auth/login-page.tsx` — removed dev-OTP banner.
- `frontend/src/features/auth/register-page.tsx` — proper phone OTP UI with
  resend, `data-testid`s.

**Docs & tooling**
- `docs/BL-01-MSG91.md` (new — operator setup, security, testing).
- `docs/sprint-reports/sprint-01-bl-01.md` (this report).
- `README.md`, `docs/deployment-*.md`, `docs/security-*.md`,
  `docs/known-limitations.md`, `docs/final-known-issues.md`,
  `docs/production-launch-checklist.md`, `docs/production-readiness-report.md`,
  `docs/RELEASE-v1.0.md`, `docs/vercel-backend.md` — swept `OTP_DEV_MODE`
  references and repointed to BL-01 doc.
- `.github/workflows/ci.yml` — CI env now uses mocked MSG91 secrets.
- `docker-compose.yml`, `docker-compose.dev.yml` — MSG91 env plumbed.
- `.env.example` (root) — MSG91 block.

---

## Rollout / operational checklist

Before flipping `MSG91_ENABLED=true` in production:

1. **MSG91 account** created and KYC-verified.
2. **Auth Key** issued and stored in the deploy secrets manager (not in
   `.env` files, not in the repo).
3. **Sender ID** approved for Bangladesh.
4. **OTP template** approved (must include `##OTP##` placeholder).
5. Set the five env vars in Vercel / Render (see
   [BL-01-MSG91.md § Configuration](BL-01-MSG91.md#configuration)).
6. Deploy to staging first; confirm a real phone receives an SMS within 30s.
7. Verify `/health/diagnostics` shows `msg91Configured: true`.
8. Rotate the Auth Key on the same schedule as JWT secrets (quarterly).

**If MSG91 misconfiguration is detected in production, the backend exits at
startup** — this is deliberate; deploying with `MSG91_ENABLED=true` but
missing keys will fail the health check before any user traffic hits the
broken auth path.

---

## Known limitations / follow-ups

| Item | Owner | Note |
|---|---|---|
| Vitest full-parallel run occasionally trips the auth rate limiter, causing 429s in tests other than BL-01's. | BL-08 (Sprint 6) | Not caused by this change; single-fork mode passes 104/104. |
| `OtpToken` Prisma model retained (no writers). | Future migration | Safe to drop in a schema cleanup. |
| `generateOtp()` helper retained (no callers). | Future cleanup | Kept to minimise BL-01 diff. |
| Email OTP flow removed from validation (was never wired to a provider). | Future | Password reset is email-only and does not require OTP today. |
| Real MSG91 Auth Key not yet issued (per user). | Client | Deployment blocked until keys land — env variables and docs are ready. |

---

## Pull Request

- **Branch:** `feature/bl-01-msg91-otp`
- **Target:** `main`
- **Title:** `BL-01: Integrate MSG91 SMS OTP provider and remove dev OTP behaviour`
- **Description body:** see `docs/sprint-reports/sprint-01-bl-01-pr.md`
  (identical narrative, shorter, used for the GitHub PR body).

Awaiting approval before starting **Sprint 2 (BL-02 — Razorpay payments).**
