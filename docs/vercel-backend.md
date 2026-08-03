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
| `VITE_FIREBASE_VAPID_KEY` | Web Push certificate key (FCM) |

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
| `GEMINI_API_KEY` | — | Google AI API key for AI match suggestions |
| `GEMINI_MODEL` | — | Gemini model id (default: `gemini-2.0-flash`) |

## Vercel project settings

- **Root Directory:** `backend`
- **Framework Preset:** Other
- **Build Command:** `npm run vercel-build` (auto from `vercel.json`)
- **Install Command:** `cd .. && npm ci` (auto from `vercel.json`)

The Vercel build runs `scripts/vercel-schema-sync.mjs`, which:

1. Runs `prisma migrate deploy` when migration history exists
2. On **P3005** (database has tables but no migration history), baselines all migrations with `prisma migrate resolve --applied`, then retries deploy
3. Finishes with `prisma db push` to apply any remaining schema drift safely

You can run the same sync locally with `npm run db:baseline` from the `backend` directory.

**Important:** `DATABASE_URL` must be enabled for **Production** and **Preview** build environments in Vercel (not only Runtime), or the build will fail during schema sync.

## Preview deployments

Vercel can scope environment variables to **Production** only. Preview deployments (PR branches) need the same variables enabled for **Preview** (and optionally **Development**) in **Settings → Environment Variables**.

| Variable | Preview value |
|----------|---------------|
| `DATABASE_URL` | Same as production (or a staging database) |
| `JWT_SECRET` | Same as production |
| `NODE_ENV` | `production` |
| `OTP_DEV_MODE` | `false` (required when `NODE_ENV=production`) |
| `CORS_ORIGIN` | Frontend preview URL or `https://pharma-exchange-frontend.vercel.app` |

If Preview env vars are missing, `/api/v1/*` routes return a bootstrap error JSON. The lightweight probes `/`, `/health`, and the Vercel rewrite path `/api` still respond without loading Express.

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
