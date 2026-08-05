# BL-10: Dependency security audit and schema cleanup

Closes: **BL-10** (Sprint 8)

## Summary

Addresses the production launch checklist dependency-security gap deferred from BL-09: upgrades Playwright, Firebase Admin, and Vercel Node tooling; adds transitive overrides; removes the dead `OtpToken` schema; documents accepted residual audit findings.

## Audit context

BL-09 out-of-scope: `npm audit` dependency upgrades. `main` had 22 audit findings. This PR reduces runtime exposure and documents remaining dev-toolchain / upstream transitive issues without breaking the Node 20 + firebase-admin v13 API surface.

## What's in this PR

### Dependencies
- `@playwright/test` ^1.62.1 (fixes browser download SSL advisory)
- `firebase-admin` ^13.10.0 (latest Node-20-compatible 13.x)
- `@vercel/node` ^5.9.5
- Root `overrides` for js-yaml, minimatch, smol-toml, uuid

### Schema
- Drop unused `OtpToken` model + migration `20260805140000_drop_otp_token`

### CI
- `npm run audit:ci` after `npm ci` (production deps, high severity)

### Docs
- `docs/BL-10-SECURITY-AUDIT.md`
- Sprint 8 reports

## Test evidence

| Gate | Result |
|---|---|
| Typecheck (frontend + backend) | ✅ |
| Frontend Vitest | ✅ 91/91 |
| Backend Vitest | ✅ in CI (Postgres service) |
| Production builds | ✅ |
| `npm audit:ci` | ⚠️ Known accepted findings documented in BL-10 doc |
| Playwright E2E | ✅ CI e2e job |

## Manual production steps

1. `npx prisma migrate deploy` — applies `drop_otp_token`
2. Review `docs/BL-10-SECURITY-AUDIT.md` accepted-risk table

## Out of scope

- `firebase-admin` v14 (Node 22 + modular API)
- `@vercel/node` v4 breaking migration
- Redis rate limiter
