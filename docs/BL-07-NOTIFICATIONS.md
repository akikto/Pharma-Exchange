# BL-07 · Notifications

**Sprint:** 5  
**Branch:** `feature/bl-07-notifications`  
**Status:** Complete — ready for review

---

## Overview

BL-07 delivers production-ready push and in-app notifications for Pharma Exchange using Firebase Cloud Messaging (FCM). The implementation spans backend delivery, user preference controls, foreground/background handling, deep-link navigation, order/payment events, admin broadcasts, retry handling, and automated tests.

---

## Architecture

```mermaid
flowchart LR
  subgraph Backend
    Events[Order / Payment / Chat / Admin]
    NS[NotificationService]
    DB[(PostgreSQL)]
    FCM[Firebase Admin SDK]
    Events --> NS
    NS --> DB
    NS --> FCM
  end

  subgraph Frontend
    SW[firebase-messaging-sw.js]
    Hook[usePushNotifications]
    Page[/notifications]
    SW -->|background click| Routes[notification-routes.ts]
    Hook -->|foreground toast click| Routes
    Page --> Routes
  end

  FCM -->|push| SW
  FCM -->|push| Hook
```

---

## Notification types

| Type | Trigger | Preference key | Push default |
|---|---|---|---|
| `BUY_REQUEST` | New request, accept/reject | `buyRequests` | On |
| `ORDER_UPDATE` | Status change, cancel, payment success/fail/refund | `orders` | On |
| `CHAT_MESSAGE` | New chat message | `chat` | On |
| `VERIFICATION` | Pharmacy approved/rejected | — (always sent) | On |
| `SYSTEM` | Admin broadcast, price alerts | `promotions` | Off |

---

## Backend

### `NotificationService`

Location: `backend/src/modules/notification/notification.service.ts`

| Method | Description |
|---|---|
| `create()` | Persists in-app notification and sends FCM push (respects prefs) |
| `sendPush()` | Delivers multicast FCM with retry + stale-token cleanup |
| `broadcast()` | Admin-only fan-out to active users |
| `list()` / `markRead()` / `markAllRead()` | In-app notification inbox |

**Retry handling:** Up to 3 retries with exponential backoff (500 ms base) for transient FCM errors (`server-unavailable`, `internal-error`, `quota-exceeded`).

**Stale tokens:** Tokens returning `registration-token-not-registered` or `invalid-registration-token` are deleted from `FcmToken`.

### API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | User | List notifications (paginated) |
| `PATCH` | `/api/v1/notifications/:id/read` | User | Mark one read |
| `POST` | `/api/v1/notifications/read-all` | User | Mark all read |
| `POST` | `/api/v1/auth/fcm-token` | User | Register device token |
| `DELETE` | `/api/v1/auth/fcm-token` | User | Remove device token |
| `PATCH` | `/api/v1/auth/me` | User | Update `notificationPrefs` |
| `POST` | `/api/v1/admin/notifications/broadcast` | Admin | Broadcast to all or selected users |

### Event integrations

| Module | Events notified |
|---|---|
| `order.service` | Status updates (buyer), cancellation (seller) |
| `payments.service` | Payment captured, failed, refund processed |
| `buyRequest.service` | New request (seller), accept/reject (buyer) |
| `chat.service` | New message |
| `pharmacy.service` | Verification decision (forced push) |
| `priceAlert.service` | Price drop alerts |
| `jobs/index` | Expiry / low-stock cron alerts |

---

## Frontend

### Device token lifecycle

1. User grants browser notification permission (`PushPermissionPrompt`).
2. `registerFcmTokenWithBackend()` obtains FCM token via Firebase JS SDK.
3. Token is posted to `POST /auth/fcm-token` with `deviceId` + `platform: web`.
4. On logout, `unregisterFcmTokenFromBackend()` removes the token.

### Foreground notifications

`usePushNotifications` subscribes to `onMessage` and shows an in-app toast. Tapping the toast navigates via `getNotificationRoute()`.

### Background notifications

`public/firebase-messaging-sw.js` (generated at build) handles `onBackgroundMessage` and `notificationclick` with seller-aware deep links.

### User preferences

Settings → Notification preferences (`/settings`):

- Buy requests
- Orders & payments
- Chat messages
- Promotions & broadcasts

Prefs sync to the backend via `PATCH /auth/me` and are enforced server-side before push delivery.

### Admin broadcast

Admin Dashboard includes a broadcast form that calls `POST /admin/notifications/broadcast`. Delivered only to users with `promotions: true`.

---

## Database

| Model | Purpose |
|---|---|
| `Notification` | In-app notification inbox |
| `FcmToken` | Registered device tokens per user |
| `User.notificationPrefs` | JSON preference blob |

No new migration required for Sprint 5 — schema was added in Sprint 3 (phase 16).

---

## Tests

| File | Coverage |
|---|---|
| `backend/tests/notificationPrefs.test.ts` | Preference normalization and type mapping |
| `backend/tests/notification.api.test.ts` | FCM token CRUD, list/mark-read, admin broadcast auth |
| `frontend/tests/notification-prefs.test.ts` | Frontend pref normalization |
| `frontend/tests/notification-routes.test.ts` | Deep-link route mapping |
| `frontend/tests/push-device.test.ts` | Device ID and token local storage |

---

## Production checklist

- [ ] Set all `FIREBASE_*` backend env vars (see `docs/FCM-SETUP.md`)
- [ ] Set all `VITE_FIREBASE_*` + `VITE_FIREBASE_VAPID_KEY` frontend env vars
- [ ] Run `npm run fcm-sw` (included in `npm run build`) before deploy
- [ ] Serve over HTTPS (required for service worker + push)
- [ ] Verify end-to-end push on a real device after deploy
