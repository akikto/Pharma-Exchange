# Performance Report — PharmEx

**Date:** August 2, 2026

## Frontend Bundle (Production Build)

| Chunk | Size (gzip) |
|-------|-------------|
| index (main) | ~73 KB |
| label (forms) | ~23 KB |
| query (TanStack) | ~16 KB |
| vendor (React) | ~15 KB |
| Route chunks | 0.4–5 KB each |

**Total PWA precache:** ~551 KB

## Optimizations Applied

1. React.lazy on all page routes with Suspense fallback
2. Manual chunks: vendor, query, ui in vite.config.ts
3. PWA: static precache + NetworkFirst for listings search (5 min TTL)
4. Vercel: 1-year immutable cache for /assets/*

## Database Indexes

Composite indexes for hot queries:
- Listing(status, expiryDate), Listing(status, finalPrice)
- BuyRequest(buyerId, status), BuyRequest(sellerId, status)
- Order(buyerId, status), Order(sellerId, status)

## Recommendations

- Lazy-load firebase SDK on auth pages only
- PgBouncer for connection pooling
- Redis cache for medicine catalog autocomplete
- Lighthouse audit on deployed HTTPS URL
