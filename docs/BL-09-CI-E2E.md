# BL-09 · CI, E2E & Auth Test Reliability

**Sprint:** 7  
**Branch:** `feature/bl-09-ci-e2e-auth`

---

## Overview

BL-09 closes the deferred production-readiness gap for automated end-to-end testing and auth test stability. Sprint reports (Sprints 1–6) tracked rate-limiter contention and missing Playwright CI as out-of-scope work; this sprint delivers those items without changing production auth behaviour.

---

## Problem statement

| Issue | Impact |
|---|---|
| Vitest parallel runs hit auth rate limits (429) | Flaky backend integration tests |
| No refresh-token rotation tests | Regression risk on auth core |
| Playwright suite not in GitHub Actions | E2E regressions undetected in CI |
| E2E requires manual `RATE_LIMIT_MAX=10000` | Operator error during QA |

---

## Solution

### 1. Test-environment rate limit isolation

**File:** `backend/src/shared/middleware/rateLimit.middleware.ts`

- All limiters (`global`, `auth`, `otp`) skip when `NODE_ENV === 'test'`.
- CI backend job sets `RATE_LIMIT_MAX=10000` as a safety net for non-test runs.
- Production limits unchanged (60 auth / 500 global per window).

### 2. Refresh token rotation tests

**File:** `backend/tests/auth.refresh-token.test.ts`

| Case | Expected |
|---|---|
| Valid refresh | New access + refresh tokens issued |
| Reuse old refresh | 401 Unauthorized |
| Logout | Refresh token removed; subsequent refresh fails |

### 3. Rate-limit isolation test

**File:** `backend/tests/auth.rate-limit.test.ts`

- 12 parallel logins in test env — all return 200, none return 429.

### 4. Playwright CI job

**Files:** `.github/workflows/ci.yml`, `playwright.config.ts`

- New `e2e` job: PostgreSQL service → `db push` → seed → Playwright (Chromium).
- Playwright starts backend (`:3000`) + frontend (`:5173`) via `webServer` array.
- `RATE_LIMIT_MAX=10000` for E2E runs.

---

## Local E2E

```bash
# Terminal 1 — backend (with seeded DB)
cd backend && RATE_LIMIT_MAX=10000 npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev

# Terminal 3 — E2E
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e
```

Or let Playwright manage both servers (requires PostgreSQL + seed):

```bash
npm run db:push && npm run db:seed
npm run test:e2e
```

---

## Production configuration

| Variable | E2E / CI | Production |
|---|---|---|
| `RATE_LIMIT_MAX` | `10000` | `500` (default) |
| `NODE_ENV` | `development` / `test` | `production` |
| PostgreSQL | Required for E2E + integration tests | Required |

No new secrets. MSG91/Razorpay disabled during E2E (`MSG91_ENABLED=false`).

---

## Out of scope (future sprint)

- `npm audit` dependency upgrades (production checklist BL-07)
- Redis-backed rate limiting for horizontal scale
- Full multi-browser Playwright matrix
