# Final Known Issues — v1.0.1-rc1

**Date:** 2026-08-05  
**Applies to:** PharmEx Release Candidate `v1.0.1-rc1`  
**Branch:** `feature/release-candidate-v1.0.1-rc1`

This document consolidates known limitations for the RC. Items marked **Blocking** must be resolved before public launch.

---

## Blocking (public launch)

| ID | Area | Issue | Status / Workaround |
|----|------|-------|---------------------|
| BL-01 | Auth | MSG91 SMS OTP | ✅ **Resolved** — [BL-01-MSG91.md](BL-01-MSG91.md) |
| BL-02 | Payments | Razorpay Standard Checkout | ✅ **Resolved** — [BL-02-RAZORPAY.md](BL-02-RAZORPAY.md) |
| BL-03 | Deploy | Production requires Firebase env, HTTPS, CORS, `DATABASE_URL` | **Open** — follow [deployment-guide.md](deployment-guide.md) |
| BL-04 | Legal | Privacy policy & terms URLs | ✅ **Resolved** — `/privacy-policy`, `/terms-and-conditions` |
| BL-05 | QA | E2E suite in CI | ✅ **Resolved** — PR #70 (BL-09); 17 Playwright specs |

---

## Non-blocking (RC / controlled beta acceptable)

| ID | Area | Issue | Notes |
|----|------|-------|-------|
| NB-01 | Security | Residual `npm audit` highs in dev toolchain | BL-10 applied safe upgrades + `audit:ci` gate |
| NB-02 | Scale | In-memory rate limiting | Single-instance only; use Redis for multi-node |
| NB-03 | Scale | Socket.IO without Redis adapter | Chat won't sync across instances |
| NB-04 | API | Legacy `/api/*` mirrors `/api/v1/*` | Maintenance overhead; deprecate in v2 |
| NB-05 | Nav UX | Seller "Orders" tab badge shows pending buy-request count | Intentional shortcut; label may confuse |
| NB-06 | Nav UX | Buyer bottom nav has Watchlist instead of Search | Search remains on home + `/search` |
| NB-07 | AI | Gemini matching optional | Rule-based fallback without `GEMINI_API_KEY` |
| NB-08 | PWA | Play Store needs TWA/Capacitor wrapper | See [play-store-checklist.md](play-store-checklist.md) |
| NB-09 | A11y | WCAG 2.1 AA audit not completed | Radix primitives + focus rings present |
| NB-10 | Auth | Stale refresh token in localStorage can cause logout loop | Clear site data / logout once after upgrade |
| NB-11 | Reviews | Review UI not implemented | Backend routes exist; no frontend |
| NB-12 | Tests | Backend integration tests need Postgres | CI provides DB; skip gracefully when unavailable |

---

## Fixed in v1.0.1-rc1 (this stabilization pass)

| Issue | Resolution |
|-------|------------|
| `/cart` showed seller orders when user mode was seller | `useHubRole()` forces buyer context on `/cart` |
| Chat integration tests flaky on shared DB | Stock-aware fixtures + resolve conversation by entity ID |
| Dead `cart-page.tsx` pass-through wrapper | Route uses `RequestsHubPage` directly |
| Duplicate lazy imports in router | Shared `loadMedicineDetail`, `loadChat`, `loadProfile`, `loadAdmin` |
| Unused deprecated `getAppHomeRoute()` | Removed from `auth-utils.ts` |
| Chat SYSTEM message tests (NB-01 prior) | Stabilized — 148/148 backend tests pass |

---

## Fixed in earlier RC / sprint work

| Issue | Resolution |
|-------|------------|
| Seller `/seller/orders` redirected to buyer cart hub | Dedicated seller pages |
| Watchlist linked to wrong medicine detail ID | Links to `/medicine/:id/compare` |
| Admin login landed on seller dashboard | `getPostLoginRoute()` → `/admin` |
| Main bundle >600 KB warning | Code-split vendor/firebase/i18n/ui chunks |
| Backend tests 503 (wrong test DB) | CI Postgres + seed alignment |
| E2E not in CI | BL-09 / PR #70 |
| Dependency security audit | BL-10 / PR #71 |

---

## Environment requirements

| Variable | Required for |
|----------|----------------|
| `DATABASE_URL` | All API features |
| `JWT_SECRET` / `REFRESH_TOKEN_SECRET` | Auth |
| `VITE_API_BASE_URL` | Frontend API calls |
| `FIREBASE_*` | Google sign-in, push notifications |
| `GEMINI_API_KEY` | Enhanced AI matching (optional) |
| `MSG91_*` | SMS OTP (production) |
| `RAZORPAY_*` | Payments (production) |

---

## Recommended pre-launch sequence

1. Deploy staging with production-like env (BL-03)
2. Run full manual regression (buyer, seller, admin) on staging
3. Complete accessibility audit (WCAG 2.1 AA)
4. Address remaining BL-10 dev-toolchain audit items
5. Configure Redis for rate limit + Socket.IO if scaling beyond one node
6. Tag `v1.0.1` after BL-03 verified on staging
