# Phase 14 — Cloud Sync (Adapted) Report

**Branch:** `cursor/phase14-cloud-sync-239a`  
**Base:** `cursor/phase13-ai-matching-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 14.1–14.5 | Firestore sync | ❌ N/A | ⏭️ Skipped — PostgreSQL REST API is source of truth |
| 14.6 | Graceful degradation | 🟡 Partial | ✅ App boots without Firebase; offline shows cached TanStack Query data |
| 14.7 | Auto-sync on startup | 🟡 Partial | ✅ `prefetchCloudData` on app load for listings, cart, orders, buy-requests, notifications |
| — | Offline indicator | ❌ Missing | ✅ `OfflineBanner` when `navigator.onLine` is false |
| — | Stale-while-revalidate | ❌ Missing | ✅ Listings `staleTime` extended to 5 minutes |

---

## Architecture Decision

Firestore-specific PRD items (14.1–14.5) are **not ported**. Cloud sync is implemented as:

1. **REST API prefetch** on startup via TanStack Query
2. **Cache-first reads** with configurable `staleTime`
3. **Reconnect refetch** via `refetchOnReconnect: true`
4. **Offline banner** when the browser reports no network

Firebase remains optional for Google Sign-In only (`isFirebaseConfigured()` guard unchanged).

---

## Files Changed

### Frontend

| File | Change |
|------|--------|
| `frontend/src/lib/query-config.ts` | Centralized stale times |
| `frontend/src/lib/query-client.ts` | Shared QueryClient with reconnect refetch |
| `frontend/src/lib/cloud-sync.ts` | Startup prefetch helpers |
| `frontend/src/lib/online-utils.ts` | Online/offline detection utilities |
| `frontend/src/hooks/use-online-status.ts` | React hook for network status |
| `frontend/src/components/layout/offline-banner.tsx` | Offline status banner |
| `frontend/src/app/providers.tsx` | Prefetch on auth ready + reconnect |
| `frontend/src/components/layout/app-layout.tsx` | Render offline banner |
| `frontend/src/hooks/use-listings.ts` | 5-minute stale time for listings |
| `frontend/tests/online-utils.test.ts` | Unit tests |
| `frontend/tests/query-config.test.ts` | Unit tests |
| `frontend/src/i18n/locales/bn.json` | Bengali-first strings |
| `frontend/src/i18n/locales/en.json` | English strings |

---

## Prefetch Targets

| Query key | When |
|-----------|------|
| `['listings', {}]` | Always (when online) |
| `['cart']` | Authenticated |
| `['orders', 'buyer']` | Authenticated |
| `['buy-requests', 'buyer']` | Authenticated |
| `['notifications']` | Authenticated |

Prefetch runs after auth initialization completes and re-runs when connectivity is restored.

---

## Quality Gates

| Check | Result |
|-------|--------|
| Backend tests | 83 passed (unchanged) |
| Frontend tests | 59 passed |
| `tsc --noEmit` | Pass |
