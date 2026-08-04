# BL-01: Integrate MSG91 SMS OTP provider and remove dev OTP behaviour

Closes: **BL-01** (Launch Blockers · Sprint 1)

## Summary

Delegates all SMS OTP generation, delivery and verification to **MSG91**
(REST v5). Removes local OTP generation, dev-mode logging, the
`OTP_DEV_MODE` flag and the `devOtp` HTTP response field. Phone-based
registration now returns `requiresOtpVerification: true` and cannot obtain
tokens without completing `POST /auth/verify-otp`.

## What's in this PR

- **New MSG91 client** at `backend/src/shared/services/msg91.service.ts`
  (`sendOtp` / `verifyOtp` / `resendOtp`, header-based auth, 10s timeout,
  Bangladesh number normalisation, structured error mapping).
- **New endpoint:** `POST /auth/resend-otp`.
- **Auth service rewritten** to route all phone flows through MSG91, drop
  local OTP token writes, and gate tokens on OTP verification.
- **Boot-time validation:** if `NODE_ENV=production` and `MSG91_ENABLED=true`
  the process exits when any of `MSG91_AUTH_KEY`/`SENDER_ID`/`TEMPLATE_ID`
  are missing.
- **Frontend** updated to drop the dev-OTP banner and to use the resend
  endpoint from the OTP login screen.
- **Docs:** [`docs/BL-01-MSG91.md`](docs/BL-01-MSG91.md) (setup checklist,
  security, error codes) and a completion report at
  [`docs/sprint-reports/sprint-01-bl-01.md`](docs/sprint-reports/sprint-01-bl-01.md).
- **CI / docker / env examples** updated across the board.

## Test evidence

| Gate | Result |
|---|---|
| `npm --workspace=backend  run lint` | ✅ 0 errors |
| `npm --workspace=frontend run lint` | ✅ 0 errors |
| Backend Vitest (single-fork) | ✅ 30 files / 104 tests |
| Frontend Vitest | ✅ 12 files / 82 tests |
| Playwright `--project=auth` | ✅ 5/5 |
| `npm run build:backend` | ✅ |
| `npm run build:frontend` | ✅ |

## Deployment notes

1. Obtain MSG91 Auth Key, approved Sender ID and OTP Template ID.
2. Set env vars in the deployment platform (see the doc above).
3. Set `MSG91_ENABLED=true`.
4. Redeploy — health check will fail fast if config is incomplete.

## Out of scope

- Full Playwright suite (buyer / seller / admin / orders) — tracked as
  **BL-08 (Sprint 6)**.
- Dropping the now-unused `OtpToken` Prisma model / `generateOtp()` helper —
  deferred to a general cleanup PR to keep this diff minimal.
