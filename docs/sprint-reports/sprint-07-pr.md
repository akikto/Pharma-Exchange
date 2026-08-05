# BL-09: CI, E2E & auth test reliability

Closes: **BL-09** (Sprint 7)

## Summary

Delivers the deferred production-readiness work for Playwright CI, rate-limiter test isolation, and refresh-token rotation tests — without changing production authentication behaviour.

## Audit context

Sprint reports (1–6) and `production-launch-checklist.md` flagged rate-limiter test flakes and missing E2E CI. Refresh rotation existed at runtime but had no automated tests. This PR adds only the missing reliability layer.

## What's in this PR

### Backend
- Skip all rate limiters when `NODE_ENV=test` (fixes parallel Vitest 429 flakes).
- `auth.refresh-token.test.ts` — rotation, stale-token rejection, logout invalidation.
- `auth.rate-limit.test.ts` — 12 parallel logins succeed in test env.
- `tests/setup.ts` — default `RATE_LIMIT_MAX=10000`.

### CI / E2E
- New GitHub Actions `e2e` job: Postgres → seed → Playwright (Chromium).
- `playwright.config.ts` starts backend + frontend via `webServer` array.
- Backend CI job sets `RATE_LIMIT_MAX=10000`.
- CI triggers on `feature/**` branches.

### Docs
- `docs/BL-09-CI-E2E.md`
- Sprint 7 reports

## Test evidence

| Gate | Result |
|---|---|
| Typecheck (frontend + backend) | ✅ |
| Frontend Vitest | ✅ |
| Backend Vitest | ✅ |
| Production builds | ✅ |
| Playwright E2E | Runs in CI `e2e` job (requires Postgres + browsers) |

## Out of scope

- `npm audit` dependency upgrades (separate production blocker).
- Redis rate limiter for multi-instance deploys.
