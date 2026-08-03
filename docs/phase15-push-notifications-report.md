# Phase 15 — Push Notifications (FCM) Report

**Branch:** `cursor/phase15-push-notifications-239a`  
**Base:** `cursor/phase14-cloud-sync-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 15.1 | FCM service (frontend) | 🟡 Backend only | ✅ `getFirebaseMessaging()` + foreground listener |
| 15.2 | FCM token retrieval | ❌ Missing | ✅ `registerFcmTokenWithBackend()` → `POST /auth/fcm-token` on login |
| 15.3 | Order status push | 🟡 In-app only | ✅ Browser push via backend FCM when token registered |
| 15.4 | FCM payload handling | ❌ Missing | ✅ `firebase-messaging-sw.js` parses notification + data payload |
| 15.5 | Notification channels | ❌ N/A (Android) | ⏭️ Web uses single notification tag grouping |
| 15.6 | Permission prompt | ❌ Missing | ✅ `PushPermissionPrompt` after sign-in when permission is `default` |
| 15.7 | Tap navigation | ✅ In-app | ✅ `notificationclick` → deep link via shared route mapping |

---

## Architecture

1. **Token registration** — After sign-in (or when permission already granted), the app registers the device FCM token with `POST /auth/fcm-token`.
2. **Background push** — `public/firebase-messaging-sw.js` (generated at build) handles `onBackgroundMessage` and `notificationclick`.
3. **Foreground push** — `onMessage` shows an in-app toast and invalidates the notifications query.
4. **Logout** — `DELETE /auth/fcm-token` removes the stored token.
5. **Graceful degradation** — When Firebase or VAPID key is not configured, push features are skipped (`isPushConfigured()` guard).

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Firebase Web SDK config |
| `VITE_FIREBASE_VAPID_KEY` | Web push certificate (Firebase Console → Cloud Messaging) |

---

## Files Changed

### Frontend

| File | Change |
|------|--------|
| `frontend/src/lib/firebase.ts` | `isPushConfigured()`, `getFirebaseMessaging()` |
| `frontend/src/lib/push-notifications.ts` | Token register/unregister, foreground subscribe |
| `frontend/src/lib/push-device.ts` | Device ID + local token/prompt state |
| `frontend/src/hooks/use-push-notifications.ts` | Auth-aware push lifecycle hook |
| `frontend/src/components/notifications/push-permission-prompt.tsx` | Permission UI |
| `frontend/public/firebase-messaging-sw.js` | Background push + click navigation |
| `frontend/scripts/generate-fcm-sw.mjs` | Build-time SW generator |
| `frontend/src/stores/auth-store.ts` | Unregister token on logout |
| `frontend/src/lib/api.ts` | DELETE with JSON body for FCM removal |

---

## Quality Gates

| Check | Result |
|-------|--------|
| Backend tests | 83 passed (unchanged) |
| Frontend tests | 64 passed |
| `tsc --noEmit` | Pass |
