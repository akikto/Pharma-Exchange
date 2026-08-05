# Release Candidate Checklist — v1.0.1-rc1

**Date:** 2026-08-05  
**Branch:** `feature/release-candidate-v1.0.1-rc1`  
**Base:** `main` @ Sprint 7 (PR #70) + BL-10 (PR #71) merged  
**Tag target:** `v1.0.1-rc1`

---

## Blocking issues (public launch)

| # | Area | Issue | Status |
|---|------|-------|--------|
| BL-01 | Auth | MSG91 SMS OTP integration | ✅ Resolved — [BL-01-MSG91.md](BL-01-MSG91.md) |
| BL-02 | Payments | Razorpay checkout + webhooks | ✅ Resolved — [BL-02-RAZORPAY.md](BL-02-RAZORPAY.md) |
| BL-03 | Deploy | Production env: Firebase, HTTPS, CORS, `DATABASE_URL` | ⚠️ **Open** — operator task; see [deployment-guide.md](deployment-guide.md) |
| BL-04 | Legal | Privacy policy & terms URLs in app | ✅ Resolved — `/privacy-policy`, `/terms-and-conditions` |
| BL-05 | QA | Playwright E2E in CI for critical paths | ✅ Resolved — PR #70 (BL-09); 17/17 specs green |

**Blocking count:** 1 deployment-configuration item (BL-03). No application code blockers remain.

---

## Non-blocking issues (RC / controlled beta acceptable)

| # | Area | Issue | Notes |
|---|------|-------|-------|
| NB-01 | Security | Residual `npm audit` highs in dev toolchain | Documented in BL-10; `audit:ci` gates critical runtime |
| NB-02 | Scale | In-memory rate limiting | Single-instance only; Redis for multi-node |
| NB-03 | Scale | Socket.IO without Redis adapter | Chat won't sync across instances |
| NB-04 | API | Legacy `/api/*` mirrors `/api/v1/*` | Deprecate in v2 |
| NB-05 | Nav UX | Seller "Orders" badge shows pending buy-request count | Intentional shortcut |
| NB-06 | Nav UX | Buyer bottom nav: Watchlist instead of Search | Search on home + `/search` |
| NB-07 | AI | Gemini matching optional | Rule-based fallback without `GEMINI_API_KEY` |
| NB-08 | PWA | Play Store needs TWA/Capacitor wrapper | See [play-store-checklist.md](play-store-checklist.md) |
| NB-09 | A11y | Full WCAG 2.1 AA audit not completed | Radix + focus rings present; audit pending |
| NB-10 | Auth | Stale refresh token can cause logout loop after upgrade | Clear site data once |
| NB-11 | Reviews | Review UI not implemented | Backend routes only |
| NB-12 | Tests | Backend integration tests require Postgres | CI provides service; local needs DB |

---

## Known limitations

| Area | Limitation |
|------|------------|
| Offline | Cart/watchlist cached via IndexedDB; mutations queue until online |
| Push | Requires FCM setup + user permission; see [FCM-SETUP.md](FCM-SETUP.md) |
| Payments | Razorpay disabled when `RAZORPAY_ENABLED=false` |
| OTP | MSG91 disabled in dev/test via `MSG91_ENABLED=false` |
| Localization | EN/BN supported; not all third-party content translated |
| Horizontal scale | Single-node assumptions for rate limit + WebSocket |

---

## Recommended fixes before public launch

1. **Deploy staging** with production-like env (BL-03) and run manual smoke on real devices.
2. **Complete WCAG 2.1 AA audit** (keyboard nav spot-check passed; full audit pending).
3. **Address remaining npm audit highs** in dev toolchain per BL-10 roadmap.
4. **Redis** for rate limiting + Socket.IO adapter before multi-instance deploy.
5. **Deprecate** legacy `/api/*` routes in API docs and client.
6. **Play Store** TWA/Capacitor wrapper per [play-store-checklist.md](play-store-checklist.md).
7. **Review UI** if user-generated reviews are a launch requirement.

---

## Quality gates (this RC pass)

| Gate | Result | Details |
|------|--------|---------|
| Frontend typecheck (`npm run lint`) | ✅ PASS | `tsc --noEmit` |
| Backend typecheck (`npm run lint`) | ✅ PASS | `tsc --noEmit` |
| Frontend unit tests | ✅ PASS | 92/92 |
| Backend integration tests | ✅ PASS | 148/148 (Postgres + seed) |
| Playwright E2E | ✅ PASS | 17/17 |
| Production frontend build | ✅ PASS | PWA precache 89 entries |
| Production backend build | ✅ PASS | `tsc` → `dist/` |

---

## Regression areas reviewed

| Area | RC status |
|------|-----------|
| Authentication | ✅ Pass — login, OTP page, role routing, admin redirect |
| Buyer flow | ✅ Pass — home, search, medicine detail, compare |
| Seller flow | ✅ Pass — dashboard, inventory, orders, requests |
| Inventory | ✅ Pass — inline edits + listing form |
| Marketplace | ✅ Pass — search, listings, pharmacy profiles |
| Cart & Checkout | ✅ Pass — hub tabs; `/cart` buyer context fixed |
| Orders | ✅ Pass — buyer + seller detail routes |
| Watchlist | ✅ Pass — nav + compare links |
| Chat | ✅ Pass — list/messages; integration tests stabilized |
| Notifications | ✅ Pass — page + deep links |
| AI Matching | ✅ Pass — `/api/v1/ai-matches` |
| Payments | ✅ Pass — Razorpay routes (mocked in tests) |
| Admin | ✅ Pass — dashboard, verifications, reports |
| Localization (EN/BN) | ✅ Pass — i18n toggle |
| Responsive layout | ✅ Pass — bottom nav @ mobile (E2E Pixel 5) |
| PWA | ✅ Pass — service worker + precache |
| Offline support | ✅ Pass — idb-keyval persistence (unit tested) |
| Push notifications | ✅ Pass — FCM SW generation; env-gated |
| Accessibility | ⚠️ Partial — labels, focus rings; full audit pending |
| Keyboard navigation | ✅ Pass — Radix primitives + nav testids |

---

## Release readiness summary

| Decision | **READY WITH MINOR ISSUES** |
|----------|----------------------------|
| Rationale | All application quality gates pass. Sprint 7 (PR #70) and BL-10 (PR #71) merged. One operator blocking item remains: production deployment configuration (BL-03). Non-blocking: WCAG full audit, scale tooling, residual dev-toolchain audit findings. |
| RC tag | Safe to tag `v1.0.1-rc1` after PR merge for controlled beta / staging |
| Public launch | Requires BL-03 staging deploy + recommended pre-launch items above |
