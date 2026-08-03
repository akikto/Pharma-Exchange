# Phase 16 — Local Data & Persistence Report

**Branch:** `cursor/phase16-local-persistence-239a`  
**Base:** `cursor/phase15-push-notifications-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 16.1 | Client persistence | 🟡 localStorage only | ✅ IndexedDB via `idb-keyval` for recent searches, listing drafts, watchlist IDs |
| 16.8 | Watchlist local cache | 🟡 IDs in localStorage | ✅ Full watchlist cached in IndexedDB; offline read fallback |
| 16.9 | Price alerts local cache | ❌ Missing | ✅ Price + triggered alerts cached; offline read fallback |
| — | Settings persistence | 🟡 Local only | ✅ `PATCH /auth/me` for language, theme, notification prefs |

---

## Architecture

1. **IndexedDB layer** — `local-db.ts` provides typed keys and a Zustand-compatible `idbStorage` adapter.
2. **Recent searches** — Migrated from `localStorage` to IndexedDB with one-time legacy migration.
3. **Listing drafts** — Seller listing form auto-saves to IndexedDB (debounced); restored on return.
4. **Offline cache** — Watchlist and alert queries write through to IndexedDB; read from cache when offline.
5. **User settings** — `notificationPrefs` JSON column on `User`; synced via `PATCH /auth/me`.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/auth/me` | Update `language`, `theme`, `notificationPrefs` |

---

## Files Changed

### Backend

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | `notificationPrefs` JSON on User |
| `backend/src/modules/auth/*` | `PATCH /auth/me` endpoint |
| `backend/tests/auth.update-profile.test.ts` | Integration test |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/lib/local-db.ts` | IndexedDB helpers + legacy migration |
| `frontend/src/lib/listing-draft.ts` | Draft save/load/clear |
| `frontend/src/lib/offline-cache.ts` | Watchlist/alerts cache |
| `frontend/src/lib/notification-prefs.ts` | Prefs normalization |
| `frontend/src/hooks/use-user-settings.ts` | Profile update hook |
| `frontend/src/stores/recent-searches-store.ts` | IndexedDB storage |
| `frontend/src/stores/watchlist-store.ts` | IndexedDB storage |
| `frontend/src/hooks/use-watchlist.ts` | Offline cache fallback |
| `frontend/src/features/seller/listing-form-page.tsx` | Draft auto-save/restore |
| `frontend/src/features/profile/profile-page.tsx` | Persist settings + theme |

---

## Quality Gates

| Check | Result |
|-------|--------|
| Backend tests | 84 passed |
| Frontend tests | 66 passed |
| `tsc --noEmit` | Pass |
