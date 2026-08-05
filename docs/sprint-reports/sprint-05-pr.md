# BL-07: Notifications (FCM push + in-app inbox)

Closes: **BL-07** (Sprint 5)

## Summary

Completes production-ready notifications for Pharma Exchange: Firebase Cloud Messaging push delivery with retry and stale-token cleanup, server-side preference enforcement, foreground/background handling with deep links, order and payment event notifications, and admin broadcast capability.

## What's in this PR

### Backend
- Enhanced `NotificationService` with user preference filtering, FCM retry (3× exponential backoff), and automatic removal of invalid tokens.
- `POST /admin/notifications/broadcast` — admin-only fan-out (respects `promotions` pref).
- Payment failure and refund processed notifications.
- Seller-aware `role` field in order/buy-request notification payloads.
- Verification notifications always push (`forcePush`).

### Frontend
- Foreground push toasts are tappable — navigate via `getNotificationRoute()`.
- Service worker deep links updated for seller order/request routes.
- Admin Dashboard broadcast form.
- New frontend test for notification prefs normalization.

### Docs
- `docs/BL-07-NOTIFICATIONS.md` — architecture, API, types, checklist
- `docs/FCM-SETUP.md` — Firebase Console + env var setup guide
- Sprint reports

### Tests
- `backend/tests/notificationPrefs.test.ts`
- `backend/tests/notification.api.test.ts`
- `frontend/tests/notification-prefs.test.ts`

## Test evidence

| Gate | Result |
|---|---|
| `tsc --noEmit` (frontend + backend) | ✅ 0 errors |
| Frontend Vitest | ✅ 86/86 |
| Backend Vitest (notification suite) | ✅ 9/9 (+ 3 DB integration tests skipped without PostgreSQL) |
| Frontend production build | ✅ (PWA precache 89 entries) |
| Backend production build | ✅ |

## Deployment notes

- Requires `FIREBASE_*` (backend) and `VITE_FIREBASE_*` + `VITE_FIREBASE_VAPID_KEY` (frontend) — see `docs/FCM-SETUP.md`.
- `npm run build` regenerates `firebase-messaging-sw.js` from env vars.
- End-to-end push must be verified on HTTPS after deploy.

## Out of scope

- Native Android notification channels (web PWA equivalent is implemented).
- Bangla translations for new admin broadcast strings (English only this sprint).
