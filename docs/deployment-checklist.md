# Deployment Checklist — PharmEx

## Pre-Deploy

- [ ] Set `JWT_SECRET` (32+ random bytes)
- [ ] Set `OTP_DEV_MODE=false`
- [ ] Configure Firebase credentials
- [ ] Set `CORS_ORIGIN` to production frontend URL
- [ ] Set `DATABASE_URL` with SSL (`?sslmode=require`)
- [ ] Set `NODE_ENV=production`
- [ ] Run `npm audit fix` and review vulnerabilities

## Database

- [ ] Run `npx prisma migrate deploy` on production DB
- [ ] Verify composite indexes applied
- [ ] Configure automated backups

## Backend Deploy

- [ ] Build Docker image: `docker build -f backend/Dockerfile -t pharmex-api .`
- [ ] Set all env vars in hosting platform
- [ ] Verify `GET /health` returns 200
- [ ] Verify `GET /api/v1/health` (if exposed)

## Frontend Deploy (Vercel)

- [ ] Set root directory to `frontend`
- [ ] Set `VITE_API_BASE_URL` to production API
- [ ] Set `VITE_SOCKET_URL` to production API origin
- [ ] Verify PWA installable (Lighthouse)
- [ ] Verify icons and manifest load

## Post-Deploy Smoke Test

- [ ] Register → verify OTP → login
- [ ] Search medicines → view listing → add to cart
- [ ] Send buy request → seller accept → order created
- [ ] Chat message send/receive
- [ ] Admin verification workflow
- [ ] Notification delivery

## Monitoring

- [ ] Health check uptime monitoring
- [ ] Error tracking (Sentry recommended)
- [ ] Log aggregation for backend

See [deployment-guide.md](./deployment-guide.md) for detailed instructions.
