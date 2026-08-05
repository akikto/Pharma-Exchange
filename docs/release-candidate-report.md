# Release Candidate Report — v1.0.1-rc1

**Date:** 2026-08-05  
**Branch:** `feature/release-candidate-v1.0.1-rc1`  
**Base:** `main` (Sprint 7 PR #70 + BL-10 PR #71 merged)  
**Tag target:** `v1.0.1-rc1`

---

## Executive Summary

This release candidate stabilization pass audits PharmEx v1.0.1 without adding features. It fixes production bugs (cart hub role context), removes dead code, consolidates router lazy imports, stabilizes flaky chat integration tests, and refreshes RC documentation.

**Release readiness decision: READY WITH MINOR ISSUES**

All quality gates pass locally with Postgres. One operator blocking item remains: production deployment configuration (BL-03). Non-blocking items include full WCAG audit, horizontal-scale tooling, and residual dev-toolchain npm audit findings documented in BL-10.

| Area | RC Status |
|------|-----------|
| Authentication | ✅ Pass |
| Buyer flow | ✅ Pass |
| Seller flow | ✅ Pass |
| Inventory | ✅ Pass |
| Marketplace | ✅ Pass |
| Cart & Checkout | ✅ Pass (cart role bug fixed) |
| Orders | ✅ Pass |
| Watchlist | ✅ Pass |
| Chat | ✅ Pass (integration tests stabilized) |
| Notifications | ✅ Pass |
| AI Matching | ✅ Pass |
| Payments | ✅ Pass (mocked in tests) |
| Admin | ✅ Pass |
| Localization (EN/BN) | ✅ Pass |
| Responsive layout | ✅ Pass |
| PWA / Offline / Push | ✅ Pass (env-gated) |
| Accessibility | ⚠️ Partial (spot check; full audit pending) |
| Build / lint / tests | ✅ Pass |

---

## Sprint 7 Verification

| Item | Status |
|------|--------|
| PR #70 — BL-09 CI E2E, rate-limit isolation | ✅ **MERGED** (2026-08-05) |
| PR #71 — BL-10 security audit | ✅ **MERGED** (on `main`) |

---

## Audit Summary

### Codebase review

- **Routes:** No duplicate or broken routes found. Legacy redirects (`/orders` → `/cart?tab=orders`, `/privacy` → `/privacy-policy`) retained intentionally.
- **Navigation:** Seller/buyer/admin post-login routing verified via E2E.
- **Dead code:** Removed `cart-page.tsx` wrapper, unused `getAppHomeRoute()`, consolidated lazy loaders.
- **TypeScript:** Clean `tsc --noEmit` on frontend and backend.
- **Console/React warnings:** No new warnings observed in E2E runs.

### Regression review

Full area-by-area status is in [release-candidate-checklist.md](release-candidate-checklist.md).

---

## Bugs Fixed

| Bug | Root cause | Fix |
|-----|------------|-----|
| Seller mode on `/cart` showed seller orders/requests | `useHubRole()` used auth `mode` for `/cart` | Force `'buyer'` when `pathname.startsWith('/cart')` |
| Chat integration tests flaky (SYSTEM messages) | Shared DB state + fragile conversation IDs | Stock-aware listing pick; resolve conversation by `buyRequestId`/`orderId` |
| Dead `cart-page.tsx` | Pass-through to `RequestsHubPage` | Deleted; router uses `RequestsHubPage` directly |

---

## Dead Code Removed

| Item | Location |
|------|----------|
| `cart-page.tsx` | `frontend/src/features/buyer/cart-page.tsx` (deleted) |
| `getAppHomeRoute()` | `frontend/src/lib/auth-utils.ts` |
| Redundant lazy import wrappers | `frontend/src/app/router.tsx` |

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/hooks/use-hub-role.ts` | Cart always buyer context |
| `frontend/src/app/router.tsx` | Direct `/cart` route; shared lazy loaders |
| `frontend/src/lib/auth-utils.ts` | Remove deprecated helper |
| `frontend/src/features/buyer/cart-page.tsx` | **Deleted** |
| `frontend/tests/use-hub-role.test.ts` | **Added** — cart role regression test |
| `backend/tests/chat.integration.test.ts` | Stabilize fixtures and assertions |
| `docs/release-candidate-report.md` | This report |
| `docs/release-candidate-checklist.md` | **Added** |
| `docs/final-known-issues.md` | Updated for post-BL-09/BL-10 state |

---

## Bundle Optimization Summary

Production frontend build (`vite build`) chunk sizes (gzip):

| Chunk | Size (gzip) |
|-------|-------------|
| `index` | 56.26 KB |
| `vendor` | 74.74 KB |
| `firebase` | 43.67 KB |
| `ui` | 26.15 KB |
| `i18n` | 19.06 KB |

**This RC pass:** Consolidated duplicate dynamic imports (`loadMedicineDetail`, `loadChat`, `loadProfile`, `loadAdmin`) so related routes share one chunk fetch. Removed dead `cart-page.tsx` module.

PWA: 89 precache entries (~4.3 MB).

---

## Accessibility Summary

| Check | Result |
|-------|--------|
| Nav `aria-label` / `data-testid` | Present |
| Back button i18n label | Present |
| Focus rings (`focus-visible`) | Present via Tailwind tokens |
| Radix UI primitives | Used for dialogs, dropdowns, tabs |
| Full WCAG 2.1 AA audit | **Not completed** — see NB-09 |

---

## Test Summary

| Suite | Result |
|-------|--------|
| Frontend lint (`tsc --noEmit`) | ✅ PASS |
| Backend lint (`tsc --noEmit`) | ✅ PASS |
| Frontend Vitest | ✅ **92/92** |
| Backend Vitest (Postgres + seed) | ✅ **148/148** |
| Playwright E2E | ✅ **17/17** |
| Production frontend build | ✅ PASS |
| Production backend build | ✅ PASS |

### E2E coverage (17 specs)

- **Buyer:** purchase, cart hub, watchlist, orders tab
- **Seller:** inventory, orders, requests, analytics links
- **Admin:** dashboard, verifications, reports
- **Auth:** buyer/seller/admin login, invalid creds, OTP page

---

## Build Summary

```bash
# Frontend
cd frontend && npm run lint && npm run test && npm run build   # ✅

# Backend
cd backend && npm run lint && npm run build && npm run test    # ✅ (needs Postgres)

# E2E (root)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/pharma_exchange?schema=public \
  npm run test:e2e                                              # ✅ 17/17
```

---

## Release Readiness Decision

| | |
|---|---|
| **Decision** | **READY WITH MINOR ISSUES** |
| **Safe for RC tag** | Yes — after PR merge to `main` |
| **Safe for public launch** | After BL-03 staging deploy + recommended items in checklist |

---

## Git Metadata

| Field | Value |
|-------|-------|
| Branch | `feature/release-candidate-v1.0.1-rc1` |
| Commit SHA | `2cd7138` |
| PR URL | *(see PR after push)* |

---

## How to Verify RC Locally

```bash
# PostgreSQL (if not running)
sudo pg_ctlcluster 16 main start
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/pharma_exchange?schema=public"
cd /workspace
npx prisma db push --schema=backend/prisma/schema.prisma
npm run db:seed --workspace=backend

# Quality gates
npm run lint --workspaces --if-present
npm run test --workspaces --if-present
npm run build --workspaces
npm run test:e2e

# Dev servers
npm run dev:backend   # :3000
npm run dev           # :5173

# Credentials (seed)
# seller@pharmex.bd / password123  → /seller
# buyer@pharmex.bd  / password123  → /
# admin@pharmex.bd  / password123  → /admin
```

---

## Related Documents

- [release-candidate-checklist.md](release-candidate-checklist.md)
- [final-known-issues.md](final-known-issues.md)
- [BL-09-CI-E2E.md](BL-09-CI-E2E.md)
- [BL-10-SECURITY-AUDIT.md](BL-10-SECURITY-AUDIT.md)
