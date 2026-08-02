# Vercel Backend Deployment

Deploy the API as a **separate Vercel project** with root directory set to `backend`.

## Required environment variables

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Required | Example |
|----------|:--------:|---------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | ✅ | 32+ random characters |
| `NODE_ENV` | ✅ | `production` |
| `OTP_DEV_MODE` | ✅ | `false` |
| `CORS_ORIGIN` | ✅ | `https://your-frontend.vercel.app` |
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
curl https://your-api.vercel.app/health
curl https://your-api.vercel.app/api/v1/health
```

## Limitations on Vercel serverless

- **Socket.IO** — not supported (use Railway/Render/Docker for real-time chat)
- **Cron jobs** — not supported (use Vercel Cron or external scheduler)
- **File uploads** — use Firebase Storage (configured via env vars)

For full features (WebSocket + cron), deploy via Docker:

```bash
docker compose up --build
```
