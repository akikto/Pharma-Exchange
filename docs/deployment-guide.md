# Deployment Guide — PharmEx

## Architecture

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend PWA | Vercel | `frontend/vercel.json` configured |
| Backend API | Docker / Railway / Render / GCP | `backend/Dockerfile` |
| Database | PostgreSQL 16 | Managed (Neon, Supabase, RDS) |
| Storage / Auth / FCM | Firebase | Service account in backend env |

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ random bytes>
NODE_ENV=production
OTP_DEV_MODE=false
CORS_ORIGIN=https://your-app.vercel.app
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_STORAGE_BUCKET=...
PORT=3000
```

### Frontend (Vercel)

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_SOCKET_URL=https://api.yourdomain.com
```

## Local Development (Docker)

```bash
docker-compose up -d postgres
cp backend/.env.example backend/.env
npm run db:generate && npm run db:push && npm run db:seed
npm run dev:all
```

Full stack with Docker:

```bash
docker-compose up --build
```

## Database Migrations

```bash
# Development
npm run db:migrate

# Production
cd backend && npx prisma migrate deploy
```

## Vercel (Frontend)

1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Build command: `npm run build` (from monorepo root: `npm run build:frontend`)
4. Output: `frontend/dist`
5. Set `VITE_API_BASE_URL` to production API URL

## Backend (Docker)

```bash
docker build -f backend/Dockerfile -t pharmex-api .
docker run -p 3000:3000 --env-file backend/.env pharmex-api
```

## Post-Deploy Checklist

- [ ] HTTPS on frontend and API
- [ ] `CORS_ORIGIN` matches frontend URL
- [ ] `OTP_DEV_MODE=false`
- [ ] Firebase credentials valid
- [ ] `prisma migrate deploy` completed
- [ ] Health check: `GET /api/v1/health`
- [ ] PWA installable (Lighthouse)

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR:
- Backend: build, test, prisma validate
- Frontend: build, test
