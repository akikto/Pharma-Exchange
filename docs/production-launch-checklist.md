# Production Launch Checklist — Pharma-Exchange v1.0.1-rc1

**Date:** 2026-08-04  
**Release:** `v1.0.1-rc1`  
**Scope:** Launch blockers only — no new marketplace features

---

## Executive Summary

| Area | Status | Score (weight) |
|------|--------|----------------|
| Production Deployment | ⚠️ Partial | 12/20 |
| Security | ⚠️ Partial | 14/20 |
| Production Services | ❌ Blocked | 4/20 |
| Quality (E2E + tests) | ⚠️ Partial | 11/15 |
| Store Readiness | ⚠️ Partial | 8/15 |
| Performance | ⚠️ Partial | 9/10 |
| **Launch Score** | | **58/100** |

**Recommendation:** **NO-GO** for public production release.  
**Recommended release date:** **2026-09-15** (after blockers below are closed and staging sign-off).

---

## 1. Production Deployment

### 1.1 Vercel configuration

| Check | Status | Notes |
|-------|--------|-------|
| Frontend `frontend/vercel.json` | ✅ | SPA rewrites, security headers, SW/manifest cache busting |
| Backend `backend/vercel.json` | ✅ | Serverless API, Prisma includeFiles, 30s max duration |
| Frontend root directory | ⬜ Verify | Vercel project → `frontend` |
| Backend root directory | ⬜ Verify | Vercel project → `backend` |
| Preview env vars enabled | ⬜ Verify | Same vars for Preview + Production builds |

### 1.2 Production environment variables

**Frontend (required)**

| Variable | Required | Verified |
|----------|:--------:|:--------:|
| `VITE_API_BASE_URL` | ✅ | ⬜ |
| `VITE_SOCKET_URL` | Recommended | ⬜ |
| `VITE_FIREBASE_*` (6 vars) | For Google/FCM | ⬜ |
| `VITE_FIREBASE_VAPID_KEY` | For web push | ⬜ |

**Backend (required)**

| Variable | Required | Verified |
|----------|:--------:|:--------:|
| `DATABASE_URL` | ✅ | ⬜ |
| `JWT_SECRET` (32+ chars) | ✅ | ⬜ |
| `NODE_ENV=production` | ✅ | ⬜ |
| `OTP_DEV_MODE=false` | ✅ | ⬜ |
| `CORS_ORIGIN` (explicit URL) | ✅ | ⬜ |
| `FIREBASE_*` | FCM + storage | ⬜ |

See: [vercel-backend.md](./vercel-backend.md), [deployment-guide.md](./deployment-guide.md)

### 1.3 PostgreSQL production database

| Check | Status |
|-------|--------|
| Managed PostgreSQL provisioned | ⬜ |
| `?sslmode=require` on connection string | ⬜ |
| Seed data **not** deployed to production | ⬜ |
| Connection pooling (PgBouncer) for scale | ⬜ Optional |

### 1.4 Prisma migrations

| Migration | Status |
|-----------|--------|
| `20260802000000_add_composite_indexes` | ✅ In repo |
| `20260803000000_add_low_stock_threshold` | ✅ |
| `20260803010000_add_bulk_request` | ✅ |
| `20260803020000_watchlist_price_alerts` | ✅ |
| `20260803030000_conversation_buy_request_id` | ✅ |
| `20260803040000_user_notification_prefs` | ✅ |
| `prisma migrate deploy` on Vercel build | ⬜ Verify on prod |
| Baseline script for P3005 | ✅ `scripts/vercel-schema-sync.mjs` |

### 1.5 Production smoke tests

```bash
API_BASE=https://<backend-host> npm run smoke
```

| Endpoint | Local (2026-08-04) | Production |
|----------|-------------------|------------|
| `GET /health` | ✅ | ⬜ |
| `GET /api/v1/health` + DB | ✅ | ⬜ |
| Public medicines/listings | ✅ | ⬜ |
| Buyer login + profile + cart | ✅ | ⬜ |
| Admin dashboard | ✅ | ⬜ |

**Note:** Run smoke tests against the live production URL after deploy; local results above are from RC validation.

---

## 2. Security

| Check | Status | Reference |
|-------|--------|-----------|
| `OTP_DEV_MODE=false` enforced at boot | ✅ Code throws in production | `backend/src/config/env.ts` |
| JWT access + refresh tokens | ✅ | `auth.middleware.ts` |
| Refresh token rotation | ✅ | `auth.service.ts` |
| CORS allowlist + PharmEx Vercel patterns | ✅ | `backend/src/config/cors.ts` |
| Rate limiting (global + auth + OTP) | ✅ | `rateLimit.middleware.ts` |
| Helmet security headers | ✅ | `backend/src/app.ts` |
| Firebase optional / validated | ✅ | `isFirebaseConfigured()` |
| No committed secrets (`.env` gitignored) | ✅ | `.gitignore` |
| `npm audit` (22 vulns: 11 high, 11 moderate) | ⚠️ | [security-audit.md](./security-audit.md) |

**Pre-launch actions:**
- [ ] Set strong production `JWT_SECRET` (not dev default)
- [ ] Set explicit `CORS_ORIGIN` (not `*`)
- [ ] Run `npm audit fix` where safe; upgrade `@vercel/node`, `react-router`, `playwright`
- [ ] Remove demo accounts / rotate seed passwords on production DB

---

## 3. Production Services

| Service | Status | Blocker |
|---------|--------|---------|
| OTP / SMS provider | ❌ | `sendOtp` logs only in dev; registration skips OTP when `OTP_DEV_MODE=false` |
| Payment gateway (bKash / SSLCommerz) | ❌ | `paymentStatus` unused; manual settlement only |
| Firebase Cloud Messaging | ⚠️ | Code ready; requires prod Firebase + VAPID |
| Production push notifications | ⬜ | End-to-end test on HTTPS required |
| Socket.IO on Vercel | ❌ N/A | Use Docker/Railway for real-time chat at scale |

---

## 4. Quality

### 4.1 Automated tests (local, 2026-08-04)

| Suite | Result |
|-------|--------|
| Frontend unit tests | ✅ 82/82 |
| Backend integration tests | ⚠️ 86/88 (2 flaky chat tests) |
| Production build | ✅ |
| Smoke script | ✅ 9/9 (when API not rate-limited) |
| Playwright E2E | ⚠️ 11/17 passed (best run); 17 specs covering all required flows |

### 4.2 Playwright E2E coverage

| Flow | Spec |
|------|------|
| Login (buyer/seller/admin, invalid creds, OTP page) | `e2e/auth/login.spec.ts` |
| Buyer purchase (browse → cart) | `e2e/buyer/purchase.spec.ts` |
| Seller inventory (inline edit, orders, requests) | `e2e/seller/inventory.spec.ts` |
| Order lifecycle | `e2e/orders/lifecycle.spec.ts` |
| Admin verification | `e2e/admin/verification.spec.ts` |

```bash
# Start backend with relaxed limits for E2E
cd backend && RATE_LIMIT_MAX=10000 npm run dev

# Run E2E (frontend dev server on :5173)
npm run test:e2e
```

---

## 5. Store Readiness

See [store-readiness.md](./store-readiness.md) for Privacy Policy, Terms, PWA, icons, and TWA checklists.

---

## 6. Performance

See [performance-audit.md](./performance-audit.md) for bundle sizes, Lighthouse plan, and WCAG audit status.

---

## Blocking Issues (must fix before public launch)

| ID | Issue | Owner action |
|----|-------|--------------|
| BL-01 | No real OTP/SMS provider | Integrate Twilio / local SMS gateway |
| BL-02 | No payment gateway | Integrate bKash or SSLCommerz |
| BL-03 | Production deploy not verified end-to-end | Deploy staging + run smoke + E2E on HTTPS |
| BL-04 | Privacy Policy URL missing | Publish legal pages; link in app + Play Console |
| BL-05 | Terms & Conditions URL missing | Publish and link |
| BL-06 | Firebase prod config not validated | Set all `VITE_FIREBASE_*` + backend service account |
| BL-07 | `npm audit` high vulnerabilities | Dependency upgrades (see security audit) |
| BL-08 | E2E suite must pass in CI | Add Playwright to GitHub Actions with rate-limit env |

---

## GO / NO-GO

| Release type | Decision |
|--------------|----------|
| **Public production (Play Store + open web)** | **NO-GO** |
| **Closed beta / RC (invited pharmacies)** | **GO** with documented limitations |
| **Staging / internal QA** | **GO** |

---

## Recommended pre-launch sequence

1. Deploy staging (frontend + backend + PostgreSQL) with production-like env
2. Close BL-01 through BL-08
3. Full manual regression (buyer, seller, admin) on staging HTTPS
4. Playwright E2E green in CI
5. Legal review (Privacy, Terms, pharmacy compliance)
6. Lighthouse + WCAG audit on production URL
7. Tag `v1.0.1` and promote staging → production
8. Play Store internal track (TWA) after legal URLs live
