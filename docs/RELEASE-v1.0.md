# Release v1.0 — Pharma Exchange

**Release date:** August 3, 2026  
**Version:** 1.0.0  
**Codename:** Full Roadmap

---

## Overview

Pharma Exchange v1.0 is the first production release of the B2B pharmacy marketplace for Bangladesh. This release completes all 17 phases of the implementation roadmap — from navigation shell through AI matching, cloud sync, push notifications, local persistence, and platform utilities.

---

## What's Included

### Buyer Experience
- Marketplace feed with featured deals, catalog view, pull-to-refresh
- Search with filters, sorting, recent searches, geolocation nearby
- Medicine detail, multi-seller price comparison
- Cart grouped by seller, buy requests, order tracking
- Watchlist and price alerts
- In-app chat with order/buy-request context
- AI match suggestions (rule-based; Gemini optional)
- Bengali-first i18n with RTL layout support

### Seller Experience
- Inventory management (active, paused, sold out, low stock)
- CSV export and Web Share
- Listing drafts (IndexedDB auto-save)
- Bulk procurement requests
- Seller dashboard and analytics
- Demo login and Google Sign-In

### Platform
- PWA with offline banner and API prefetch
- FCM push notifications (when configured)
- IndexedDB persistence for searches, drafts, offline cache
- Settings sync (`PATCH /auth/me`) for language, theme, notification prefs
- Accessibility: focus rings, reduced motion support

---

## Quality Summary

| Metric | Value |
|--------|-------|
| Backend tests | 84 passed |
| Frontend tests | 70 passed |
| Smoke tests | 9/9 passed |
| Type-check | Clean |
| Production build | Success |

---

## Upgrade / Deploy Notes

1. Merge `main` (includes Phases 1–17)
2. Run `npx prisma migrate deploy` on production PostgreSQL
3. Configure Vercel env vars per [production-readiness-report.md](./production-readiness-report.md)
4. Set `MSG91_ENABLED=true` + MSG91 secrets in production
5. Deploy backend, then frontend
6. Run smoke tests against production API

---

## Optional Integrations

| Integration | Env var | Effect if missing |
|-------------|---------|-------------------|
| Google Gemini | `GEMINI_API_KEY` | AI matches use rule-based scoring only |
| Firebase Admin | `FIREBASE_*` | No FCM push; demo auth still works |
| Firebase Web + VAPID | `VITE_FIREBASE_*`, `VITE_FIREBASE_VAPID_KEY` | No Google Sign-In or browser push |

---

## Known Gaps (Post-v1.0)

- Production SMS/email OTP gateway
- Playwright E2E test suite
- Play Store TWA/APK wrapper
- Full WCAG 2.1 AA audit
- Home top bar scroll collapse

---

## PR Stack Merged

Phases 10–17 were merged as a single stack onto `main`:

| PR | Phase |
|----|-------|
| #41 | Phase 10 — In-App Chat |
| #42 | Phase 11 — Shop Profile |
| #43 | Phase 12 — Seller Auth |
| #44 | Phase 13 — AI Matching |
| #45 | Phase 14 — Cloud Sync |
| #46 | Phase 15 — Push Notifications |
| #47 | Phase 16 — Local Persistence |
| #48 | Phase 17 — Utilities & Platform |

Earlier phases (1–9) were included in the same merge commit from the phase branch lineage.

---

## Tag

```bash
git tag -a v1.0.0 -m "Pharma Exchange v1.0 — Full roadmap release"
git push origin v1.0.0
```
