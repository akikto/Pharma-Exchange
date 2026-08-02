# Performance Summary — PharmEx

**Date:** August 2, 2026  
**Full report:** [performance-report.md](./performance-report.md)

## Frontend Bundle (Post-Audit)

| Metric | Value |
|--------|-------|
| Main chunk (gzip) | ~86 KB |
| Total PWA precache | ~573 KB |
| Route chunks | 0.8–5.6 KB each |
| Lazy-loaded routes | 25+ screens |

## Optimizations Applied

- React.lazy + Suspense on all routes
- Manual chunks: vendor, query, ui
- PWA Workbox precaching + NetworkFirst for listings
- Vercel immutable asset caching (1 year)
- Composite DB indexes on hot query paths

## Backend

- Pagination on all list endpoints (default 20, max 100)
- Prisma `select`/`include` scoped per endpoint
- Atomic stock updates via `updateMany` with quantity guard

## Recommendations

- Lighthouse audit on deployed HTTPS URL
- PgBouncer for connection pooling at scale
- Redis cache for medicine catalog autocomplete
- Lazy-load Firebase SDK when client auth is wired
