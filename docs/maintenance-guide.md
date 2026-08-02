# Maintenance Guide — PharmEx

## Routine Operations

### Database
- Run `prisma migrate deploy` after each schema release
- Monitor slow queries; add indexes via new migrations
- Backup PostgreSQL daily (managed provider snapshots recommended)

### Background Jobs
Cron jobs in `backend/src/jobs/`:
- Expiry alerts for listings
- Buy request expiration
- Stale listing cleanup

Ensure a single backend instance runs jobs, or use a distributed lock (Redis) if scaled horizontally.

### Logs
- Winston logger in `backend/src/shared/utils/logger.ts`
- Set `LOG_LEVEL=info` in production, `debug` only for troubleshooting

### Dependencies
```bash
npm outdated
npm audit
npm audit fix
```

Run monthly and before major releases.

## Monitoring (Recommended)

- **Uptime:** Ping `/api/v1/health`
- **Errors:** Sentry or similar (not yet integrated)
- **Metrics:** Request latency, DB connection pool, Socket.IO connections

## Scaling

| Bottleneck | Solution |
|------------|----------|
| API CPU | Horizontal scale behind load balancer |
| Rate limits | Redis-backed rate limiter |
| DB connections | PgBouncer |
| Socket.IO | Redis adapter for multi-instance |
| Static assets | Vercel CDN (frontend) |

## Incident Response

1. Check health endpoint and recent deploys
2. Review logs for 5xx spikes
3. Roll back via Vercel/Docker previous image
4. Rotate `JWT_SECRET` if token compromise suspected (invalidates all sessions)

## Release Process

1. Feature branch → PR → CI green
2. Merge to `main`
3. Deploy backend (Docker) then frontend (Vercel)
4. Run `prisma migrate deploy`
5. Smoke test: login, search, create buy request
