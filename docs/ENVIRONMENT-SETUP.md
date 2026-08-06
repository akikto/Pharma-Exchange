# Environment Setup — Production

This is the single source of truth for **what env vars go where** for
Pharma-Exchange. Templates live at:

- `backend/.env.production.example`
- `frontend/.env.production.example`
- `backend/.env.example` (dev)
- `frontend/.env.example` (dev)
- `.env.example` (root — reference)

Never commit real values. Vercel is the vault.

---

## Backend (`backend/.env.production.example`)

The backend fails fast during boot if any required production variable is
missing or malformed. Enforcement lives in `backend/src/config/env.ts`.

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | ✅ | Must be `production` on Vercel Production. |
| `DATABASE_URL` | ✅ | **Must** start with `postgresql://`. Use a pooled DSN on serverless — append `?sslmode=require&pgbouncer=true&connection_limit=1`. |
| `JWT_SECRET` | ✅ | **≥ 32 chars.** Generate with `openssl rand -base64 48`. Rotate quarterly. |
| `JWT_EXPIRES_IN` | — | Default `7d`. |
| `JWT_REFRESH_EXPIRES_IN` | — | Default `30d`. |
| `CORS_ORIGIN` | ✅ | Comma-separated list. Never `*` in prod. |
| `RATE_LIMIT_WINDOW_MS` | — | Default 900 000. |
| `RATE_LIMIT_MAX` | — | Default 500 (prod). |
| `LOG_LEVEL` | — | `info` in prod. |
| `FIREBASE_PROJECT_ID` | ✅* | Required if Firebase Auth / FCM is enabled. |
| `FIREBASE_CLIENT_EMAIL` | ✅* | Service account email. |
| `FIREBASE_PRIVATE_KEY` | ✅* | Store with `\n` escapes; the code un-escapes. |
| `FIREBASE_STORAGE_BUCKET` | ✅* | Required for uploads. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | ✅ | Required in production for password-reset email. |
| `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | ✅ | Gmail SMTP credentials (use an app password). |
| `PASSWORD_RESET_URL_BASE` | ✅ | Frontend app URL for reset links (e.g. `https://pharma-exchange-frontend.vercel.app`). Must **not** be the backend API URL. |
| `RAZORPAY_ENABLED` | ✅ | `true` in prod. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | ✅ | Boot fails fast if any is missing when `RAZORPAY_ENABLED=true`. |
| `RAZORPAY_CURRENCY` | — | Default `INR`. Use `USD` for Razorpay International. |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | — | Optional AI enrichment. |

**\*** = required only when the corresponding feature (Firebase, SMTP email,
Razorpay) is enabled. When the feature flag is off, the app boots with the
capability disabled and the value stays empty.

---

## Frontend (`frontend/.env.production.example`)

Only `VITE_*` variables are exposed to the browser bundle. **Never put a
secret in a `VITE_*` variable.**

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Usually `/api/v1` (proxied by Vercel) or `https://api.pharmaex.bd/api/v1`. |
| `VITE_SOCKET_URL` | — | Optional realtime endpoint. |
| `VITE_FIREBASE_API_KEY` | ✅* | Public Firebase config value. Safe to expose. |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅* | Public. |
| `VITE_FIREBASE_PROJECT_ID` | ✅* | Public. |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅* | Public. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅* | Public. |
| `VITE_FIREBASE_APP_ID` | ✅* | Public. |
| `VITE_FIREBASE_VAPID_KEY` | ✅* | Public. Web push registration only. |

---

## GitHub Actions (`.github/workflows/ci.yml`)

CI already ships with **mock** values that make the tests self-contained.
For workflows that need real credentials (e.g. staging deploy jobs), use
GitHub → Settings → Secrets and Variables → Actions, and reference them as
`${{ secrets.NAME }}`. Never inline production values in the YAML.

The currently-injected env for the test job:

```
DATABASE_URL          postgres://…                (ephemeral CI Postgres)
JWT_SECRET            ci-jwt-secret-min-32-…      (test-only)
SMTP_HOST=smtp.gmail.com    SMTP_USER=ci-test@gmail.com   (email mocked in tests)
RAZORPAY_ENABLED=true RAZORPAY_KEY_ID=rzp_test_…  (SDK mocked in tests)
```

---

## CSP

Not enforced yet (would break Razorpay Checkout unless allow-listed). When
you're ready:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://www.gstatic.com;
  connect-src 'self' https://*.razorpay.com https://firebaseinstallations.googleapis.com
              https://firestore.googleapis.com https://fcmregistrations.googleapis.com
              https://api.pharmaex.bd wss://api.pharmaex.bd;
  frame-src 'self' https://api.razorpay.com https://pharma-exchange.firebaseapp.com;
  img-src 'self' data: https://*.googleusercontent.com https://firebasestorage.googleapis.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
```

Add via `frontend/vercel.json` when the third-party allow-list is
finalised.

---

## Rotation cadence

| Secret | Cadence | Owner |
|---|---|---|
| `JWT_SECRET` | Quarterly | Platform |
| `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Quarterly + after suspected leak | Payments |
| `SMTP_PASS` | Quarterly | Auth |
| Firebase service-account key | 90 days | Platform |
| PostgreSQL user password | Quarterly | Platform |
| GitHub Actions secrets | Aligned with above | Platform |
