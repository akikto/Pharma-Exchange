# Sprint 5 · BL-07 — Notifications · Completion Report

**Branch:** `feature/bl-07-notifications`  
**Status:** ✅ Complete — ready for review (PR not opened — awaiting approval)

---

## Pre-work inspection

Main was synced (`git pull origin main` — already up to date). Existing notification infrastructure from Phases 15–16 was present:

| Area | Pre-existing | Sprint 5 additions |
|---|---|---|
| Prisma `Notification`, `FcmToken`, `notificationPrefs` | ✅ | — |
| Backend `NotificationService` (basic FCM) | ✅ | Retry, prefs filter, stale-token cleanup, broadcast |
| FCM token registration (`POST /auth/fcm-token`) | ✅ | — |
| Notification preferences UI (`/settings`) | ✅ | Server-side enforcement |
| Foreground push (`onMessage` + toast) | ✅ | Click-to-navigate deep links |
| Background push (service worker) | ✅ | Seller-aware deep links |
| Notification click handling (in-app list) | ✅ | — |
| Order / buy-request / chat notifications | ✅ | Seller `role` in payload data |
| Payment success notification | ✅ | Failure + refund notifications |
| Admin broadcast | ❌ | API + dashboard UI |
| Retry handling | ❌ | Exponential backoff (3 retries) |
| Backend notification tests | ❌ | 2 new test files |
| BL-07 / FCM documentation | ❌ | 2 new docs |

---

## Deliverables

| # | Item | Status |
|---|---|---|
| 1 | Firebase Cloud Messaging integration | ✅ |
| 2 | Device token registration / removal | ✅ |
| 3 | Notification preferences (UI + server enforcement) | ✅ |
| 4 | Foreground notifications with click navigation | ✅ |
| 5 | Background notifications via service worker | ✅ |
| 6 | Notification click handling (SW + in-app list) | ✅ |
| 7 | Order notifications | ✅ |
| 8 | Payment notifications (success, failure, refund) | ✅ |
| 9 | Admin broadcast notifications | ✅ |
| 10 | FCM retry + stale token cleanup | ✅ |
| 11 | Documentation (`BL-07-NOTIFICATIONS.md`, `FCM-SETUP.md`) | ✅ |
| 12 | Tests | ✅ |
| 13 | Sprint report + PR body | ✅ |

---

## Files changed

### Added
- `backend/src/modules/notification/notificationPrefs.ts` — server-side preference helpers
- `backend/src/modules/notification/notification.validation.ts` — broadcast Zod schema
- `backend/tests/notificationPrefs.test.ts`
- `backend/tests/notification.api.test.ts`
- `frontend/tests/notification-prefs.test.ts`
- `docs/BL-07-NOTIFICATIONS.md`
- `docs/FCM-SETUP.md`
- `docs/sprint-reports/sprint-05.md` (this file)
- `docs/sprint-reports/sprint-05-pr.md`

### Modified
- `backend/src/modules/notification/notification.service.ts` — prefs, retry, broadcast, token cleanup
- `backend/src/modules/notification/index.ts` — export prefs helpers
- `backend/src/modules/admin/admin.routes.ts` — `POST /admin/notifications/broadcast`
- `backend/src/modules/payments/payments.service.ts` — payment failed + refund notifications
- `backend/src/modules/order/order.service.ts` — seller deep-link `role` in cancel notification
- `backend/src/modules/buy-request/buyRequest.service.ts` — seller deep-link `role`
- `backend/src/modules/pharmacy/pharmacy.service.ts` — `forcePush` on verification
- `frontend/scripts/generate-fcm-sw.mjs` — seller-aware SW deep links
- `frontend/public/firebase-messaging-sw.js` — regenerated
- `frontend/src/hooks/use-push-notifications.ts` — foreground click navigation
- `frontend/src/hooks/use-toast.tsx` — optional `onClick` on toasts
- `frontend/src/features/admin/admin-dashboard-page.tsx` — broadcast form
- `frontend/src/i18n/locales/en.json` — admin broadcast strings

---

## Test / build results

| Gate | Result |
|---|---|
| `tsc --noEmit` (frontend) | ✅ 0 errors |
| `tsc --noEmit` (backend) | ✅ 0 errors |
| Frontend Vitest | ✅ **86/86** (2 new notification-prefs tests + previous 84) |
| Backend Vitest — notification suite | ✅ **9/9** pass (+ 3 integration tests skipped — no local PostgreSQL) |
| Backend Vitest (full, requires DB) | ⚠️ Integration tests need PostgreSQL (same as CI / prior sprints) |
| Frontend production build | ✅ 89 precache entries |
| Backend production build | ✅ tsc OK |

---

## Confirmation

- ✅ Synced latest `main` before branching
- ✅ Branch: `feature/bl-07-notifications` (no commits on `main`)
- ✅ Existing architecture preserved (React + Vite, Express + Prisma, PostgreSQL, Firebase Auth)
- ✅ PR **not** opened — waiting for approval
