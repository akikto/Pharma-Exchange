# Sprint 8 · BL-10 — Dependency Security Audit · Completion Report

**Branch:** `cursor/bl-10-security-audit-51d7`  
**Status:** ✅ Complete

---

## Pre-work audit (main @ `98f8284`)

BL-09 explicitly deferred `npm audit` dependency upgrades. Production checklist BL-07 and `docs/security-audit.md` listed 22 vulnerabilities (11 high).

| Area | On main before BL-10 | Status |
|---|---|---|
| Playwright ≥ 1.55.1 | ❌ ^1.51.0 | **Upgraded to ^1.62.1** |
| `firebase-admin` current 13.x | ❌ ^13.2.0 | **Upgraded to ^13.10.0** |
| `@vercel/node` current 5.x | ❌ ^5.1.14 | **Upgraded to ^5.9.5** |
| Root `overrides` for transitive fixes | ❌ | **Added** |
| `OtpToken` dead schema | ❌ Retained from BL-01 | **Removed + migration** |
| `npm audit` CI gate | ❌ | **Added `audit:ci` script** |
| BL-10 documentation | ❌ | **Added** |

---

## Deliverables

| # | Item | Status |
|---|---|---|
| 1 | Safe dependency upgrades (Playwright, firebase-admin, @vercel/node) | ✅ |
| 2 | Transitive `overrides` for js-yaml, minimatch, smol-toml, uuid | ✅ |
| 3 | Drop legacy `OtpToken` model + migration | ✅ |
| 4 | `npm run audit:ci` production gate | ✅ |
| 5 | Document accepted residual risks | ✅ |
| 6 | Documentation + sprint reports | ✅ |

---

## Files changed

### Added
- `backend/prisma/migrations/20260805140000_drop_otp_token/migration.sql`
- `docs/BL-10-SECURITY-AUDIT.md`
- `docs/sprint-reports/sprint-08.md`
- `docs/sprint-reports/sprint-08-pr.md`

### Modified
- `package.json` — Playwright upgrade, overrides, `audit:ci` script
- `package-lock.json` — lockfile refresh
- `backend/package.json` — firebase-admin, @vercel/node versions
- `backend/prisma/schema.prisma` — remove `OtpToken` model
- `.github/workflows/ci.yml` — `npm run audit:ci` step

---

## Test / build results

| Gate | Result |
|---|---|
| `tsc --noEmit` (frontend + backend) | ✅ |
| Frontend Vitest | ✅ 91/91 |
| Backend Vitest (with PostgreSQL / CI) | ✅ (CI) |
| Production builds | ✅ |
| `npm audit --omit=dev` | ⚠️ 10 findings — documented accepted risks (see BL-10 doc) |
| Playwright E2E | ✅ (CI e2e job — unchanged by this sprint) |

---

## Production configuration before deploy

- No new env vars.
- Run `npx prisma migrate deploy` to apply `drop_otp_token` migration.
- Re-run `npm audit --omit=dev` after deploy and compare to `docs/BL-10-SECURITY-AUDIT.md` accepted-risk table.

---

## Confirmation

- ✅ Synced latest `main` (PR #70 merged)
- ✅ No duplicate rewrites of BL-01–BL-09 features
- ✅ PR opened against `main`
