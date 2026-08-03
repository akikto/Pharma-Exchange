# Vercel Backend Deployment

Deploy the API as a **separate Vercel project** with root directory set to `backend`.

## Quick setup checklist

1. Vercel project → **Settings → General → Root Directory** → `backend`
2. Vercel project → **Settings → Environment Variables** → add all required vars below
3. **Deployments** → Redeploy latest `main` branch
4. Verify: `curl https://pharma-exchange-backend.vercel.app/health`

## Frontend (Vercel)

Set in your **frontend** Vercel project:

| Variable | Value |
|----------|-------|
| `VITE_FIREBASE_API_KEY` | Firebase web config `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_API_BASE_URL` | `https://pharma-exchange-backend.vercel.app/api/v1` |

## Backend (Vercel)

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Required | Example |
|----------|:--------:|---------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | ✅ | 32+ random characters |
| `NODE_ENV` | ✅ | `production` |
| `OTP_DEV_MODE` | ✅ | `false` |
| `CORS_ORIGIN` | ✅ | `https://pharma-exchange-frontend.vercel.app` |
| `FIREBASE_PROJECT_ID` | — | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | — | Service account email |
| `FIREBASE_PRIVATE_KEY` | — | Service account private key |
| `FIREBASE_STORAGE_BUCKET` | — | Storage bucket |

## Vercel project settings

- **Root Directory:** `backend`
- **Framework Preset:** Other
- **Build Command:** `npx prisma generate && npm run build` (auto from `vercel.json`)
- **Install Command:** `cd .. && npm ci` (auto from `vercel.json`)

## Verify deployment

```bash
curl https://your-api.vercel.app/
curl https://your-api.vercel.app/health
curl https://your-api.vercel.app/api/v1/health
```

`/` and `/health` respond without bootstrapping Express. On Vercel, the root path does not reliably hit rewrites, so `/` is redirected to `/api` (via `vercel.json` and `middleware.ts`) before the serverless handler runs.

## Preview deployments

Enable the same environment variables for **Preview** (not only Production) in **Settings → Environment Variables**. If Preview env vars are missing, `/api/v1/*` routes return a bootstrap error JSON while `/`, `/health`, and `/api` still respond.

## Limitations on Vercel serverless

- **Socket.IO** — not supported (use Railway/Render/Docker for real-time chat)
- **Cron jobs** — not supported (use Vercel Cron or external scheduler)
- **File uploads** — use Firebase Storage (configured via env vars)

For full features (WebSocket + cron), deploy via Docker:

```bash
docker compose up --build
```
