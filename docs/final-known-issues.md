# Final Known Issues — v1.0.1-rc1

**Date:** 2026-08-04  
**Applies to:** PharmEx Release Candidate `v1.0.1-rc1`

This document consolidates known limitations for the RC. Items marked **Blocking** must be resolved before public launch.

---

## Blocking (public launch)

| ID | Area | Issue | Workaround |
|----|------|-------|------------|
| BL-01 | Auth | OTP sent only in dev mode (`OTP_DEV_MODE`); no SMS/email provider | Email/password, demo login, Firebase (when configured) |
| BL-02 | Payments | No payment gateway; `paymentStatus` unused | Manual payment outside app |
| BL-03 | Deploy | Production requires Firebase env, HTTPS, CORS, `DATABASE_URL` on host | Follow `docs/deployment-guide.md` |
| BL-04 | Legal | Privacy policy URL not bundled | Required for Play Store |
| BL-05 | QA | No automated E2E suite | Manual smoke + integration tests |

---

## Non-blocking (RC / controlled beta acceptable)

| ID | Area | Issue | Notes |
|----|------|-------|-------|
| NB-01 | Tests | 2 chat integration tests fail intermittently | SYSTEM message after buy-request reject / order update; shared DB state |
| NB-02 | Security | `npm audit` reports moderate/high dependency issues | Run `npm audit fix` before production hardening |
| NB-03 | Scale | In-memory rate limiting | Single-instance only; use Redis for multi-node |
| NB-04 | Scale | Socket.IO without Redis adapter | Chat won't sync across instances |
| NB-05 | API | Legacy `/api/*` mirrors `/api/v1/*` | Maintenance overhead; deprecate in v2 |
| NB-06 | Nav UX | Seller "Orders" tab badge shows pending buy-request count | Intentional shortcut; label may confuse |
| NB-07 | Nav UX | Buyer bottom nav has Watchlist instead of Search | Search remains on home + `/search` |
| NB-08 | AI | Gemini matching optional | Rule-based fallback without `GEMINI_API_KEY` |
| NB-09 | PWA | Play Store needs TWA/Capacitor wrapper | See `docs/play-store-checklist.md` |
| NB-10 | A11y | WCAG 2.1 AA audit not completed | Radix primitives + focus rings present; full audit pending |
| NB-11 | Auth | Stale refresh token in browser localStorage can cause logout loop | Clear site data / logout once after upgrade |
| NB-12 | Reviews | Review UI not implemented | Backend routes exist; no frontend |

---

## Fixed in v1.0.1-rc1 (previously reported)

| Issue | Resolution |
|-------|------------|
| Seller `/seller/orders` redirected to buyer cart hub | Dedicated seller pages |
| Watchlist linked to wrong medicine detail ID | Links to `/medicine/:id/compare` |
| `Cannot read properties of undefined (reading 'id')` | Nav badge + listing guards (PR #61–#62) |
| Admin login landed on seller dashboard | `getPostLoginRoute()` → `/admin` |
| Seller analytics order links used buyer paths | `/seller/orders/:id` |
| Buy-request accept sent sellers to `/orders/:id` | Role-aware path |
| Notification order links ignored seller context | `role=seller` in payload |
| Main bundle >600 KB warning | Code-split vendor/firebase/i18n/ui chunks |
| Backend tests 503 (wrong test DB) | `tests/setup.ts` uses seeded `medlink_b2b` |

---

## Environment requirements

| Variable | Required for |
|----------|----------------|
| `DATABASE_URL` | All API features |
| `JWT_SECRET` / `REFRESH_TOKEN_SECRET` | Auth |
| `VITE_API_BASE_URL` | Frontend API calls |
| `FIREBASE_*` | Google sign-in, push notifications |
| `GEMINI_API_KEY` | Enhanced AI matching (optional) |

---

## Recommended pre-launch sequence

1. Deploy staging with production-like env
2. Run full manual regression (buyer, seller, admin)
3. Add E2E tests for login → cart → order
4. Integrate OTP provider
5. Integrate payment gateway
6. Complete accessibility audit
7. Security review + dependency audit
8. Tag `v1.0.1` after blocking items closed
