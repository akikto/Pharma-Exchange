# Firebase Cloud Messaging (FCM) Setup

This guide configures push notifications for Pharma Exchange in development and production.

---

## Prerequisites

- A Firebase project with **Cloud Messaging** enabled
- Firebase Authentication already configured (BL-06)
- HTTPS origin for production (Vercel / custom domain)

---

## 1. Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. **Project settings → General → Your apps** — register a **Web** app if not already done.
3. Copy the Firebase config object (`apiKey`, `authDomain`, `projectId`, etc.).
4. **Project settings → Cloud Messaging → Web Push certificates** — generate a **VAPID key pair**. Copy the public key.

---

## 2. Backend (Firebase Admin SDK)

Create a service account:

1. **Project settings → Service accounts → Generate new private key**
2. Save the JSON file securely (never commit to git).

Set these environment variables on the backend (`.env` or Vercel):

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

> **Note:** `FIREBASE_PRIVATE_KEY` must preserve `\n` line breaks. In Vercel, paste the key with literal `\n` sequences.

When credentials are missing, the backend logs `[DEV FCM]` instead of sending real pushes — useful for local development without Firebase.

---

## 3. Frontend (Firebase JS SDK)

Set in `frontend/.env` (development) or Vercel environment (production):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...
VITE_FIREBASE_VAPID_KEY=BP...your-vapid-public-key
```

---

## 4. Service worker generation

The service worker is **not** hand-edited. It is generated at build time:

```bash
cd frontend
npm run fcm-sw    # reads .env and writes public/firebase-messaging-sw.js
npm run build     # runs fcm-sw automatically before vite build
```

The generated file:

- Initializes Firebase Messaging when config is present
- Handles `onBackgroundMessage` (system notification tray)
- Handles `notificationclick` (deep link into the app)

---

## 5. Verify locally

1. Start backend and frontend with Firebase env vars set.
2. Log in, accept the push permission prompt.
3. Check backend logs for successful `POST /auth/fcm-token`.
4. Trigger a test notification (e.g. change an order status via seller account).
5. Confirm:
   - **Foreground:** in-app toast appears; tap navigates to the entity
   - **Background:** system notification appears; tap opens the correct screen

---

## 6. Production deployment

| Step | Action |
|---|---|
| 1 | Add all `FIREBASE_*` vars to backend host (Vercel / Docker) |
| 2 | Add all `VITE_FIREBASE_*` vars to frontend host |
| 3 | Redeploy both services |
| 4 | Test on a real mobile browser (Chrome Android recommended) |
| 5 | Confirm service worker registers at `/firebase-messaging-sw.js` |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| No permission prompt | Check `isPushConfigured()` — missing `VITE_FIREBASE_*` vars |
| Token registration 401 | User must be authenticated; check JWT |
| Push not received | Verify backend `FIREBASE_*` vars; check user notification prefs |
| Background push missing | Ensure HTTPS; confirm SW registered; run `npm run fcm-sw` |
| `messaging/permission-blocked` | User denied permission; reset in browser site settings |
| Stale tokens | Backend auto-removes invalid tokens on FCM error response |

---

## Security notes

- FCM tokens are user-scoped; a token registered to another account returns `403`.
- Tokens are removed on logout.
- Admin broadcasts respect the `promotions` preference.
- Verification notifications bypass preference checks (critical account events).
