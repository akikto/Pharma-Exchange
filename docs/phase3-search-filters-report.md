# Phase 3 — Search & Discovery + Filtering & Sorting Report

**Branch:** `cursor/phase3-search-filters-239a`  
**Base:** `cursor/phase2-marketplace-feed-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

### Search & Discovery

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 3.1 | Predictive autocomplete | 🟡 Partial | ✅ Implemented (`SearchInput` + `GET /medicines?q=`) |
| 3.2 | Recent searches | ❌ Missing | ✅ Implemented (`recent-searches-store`, localStorage) |
| 3.3 | Therapeutic category filters | ❌ Missing | ✅ Implemented (chip UI → `category` param) |
| 3.4 | Dosage form filters | ❌ Missing | ✅ Implemented (chip UI → `dosageForm` param) |
| 3.5 | Generic alternatives discovery | ❌ Missing | ✅ Implemented (`GET /medicines/:id/alternatives` + UI) |
| 3.6 | Voice search (placeholder) | ❌ Missing | ✅ Implemented (mic button injects demo query) |
| 3.7 | Search result actions | 🟡 Partial | ✅ Implemented (cart, watchlist, compare on cards) |

### Filtering & Sorting

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 3.8 | Quick filters (All, Near Me, Short Expiry, 50%+ Off, Overstock) | 🟡 Partial | ✅ Implemented (home chips + API params) |
| 3.9 | Drug category chips | ❌ Missing | ✅ Implemented (dosage form chips on search) |
| 3.10 | Marketplace sorting | 🟡 Partial | ✅ Implemented (recommended, price asc/desc, rating, distance) |
| 3.11 | Advanced filters | 🟡 Partial | ✅ Implemented (bottom sheet: max price, min rating, distance, verified, in-stock) |
| 3.12 | Filter reset | 🟡 Partial | ✅ Implemented (clear all on search page) |
| 3.13 | Active filter counter | ❌ Missing | ✅ Implemented (badge on filter icon) |

---

## Remaining Gaps

| Feature | Status | Notes |
|---------|--------|-------|
| Compare action | 🟡 Partial | Opens comparison modal stub (full screen = Phase 4) |
| Watchlist on cards | 🟡 Partial | Local store only; full watchlist screen = Phase 9 |
| Distance sort without geolocation | ⚠ Needs Improvement | Requires browser location or manual coords |
| Therapeutic categories | ⚠ Needs Improvement | Maps to `category contains` — seed data uses free-form categories |
| Chewable dosage chip | ⚠ Needs Improvement | Maps to `TABLET` enum (no `CHEWABLE` in Prisma) |
| Geo at scale | ⚠ Needs Improvement | Distance sort fetches up to 500 rows in-memory (MVP) |

---

## Files Changed

### Backend (new/modified)

| File | Change |
|------|--------|
| `backend/src/modules/listing/listing.service.ts` | Geo radius, dosageForm, rating, stock, overstock, expiry days, recommended/distance sort |
| `backend/src/modules/listing/listing.validation.ts` | New query params + sort options |
| `backend/src/modules/medicine/medicine.service.ts` | `getAlternatives()` |
| `backend/src/modules/medicine/medicine.controller.ts` | Alternatives endpoint |
| `backend/src/modules/medicine/medicine.routes.ts` | `GET /:id/alternatives` |
| `backend/src/shared/utils/geo.ts` | Haversine distance helper |
| `backend/tests/geo.test.ts` | Geo unit tests |
| `backend/tests/listing.search.test.ts` | Search filter integration tests |

### Frontend (new/modified)

| File | Change |
|------|--------|
| `frontend/src/features/home/search-page.tsx` | Full Phase 3 search experience |
| `frontend/src/features/home/home-page.tsx` | PRD-aligned quick filters + geo |
| `frontend/src/components/listing-card.tsx` | Inline cart/watchlist/compare actions |
| `frontend/src/components/search/search-input.tsx` | Autocomplete, recent searches, voice |
| `frontend/src/components/search/filter-chips.tsx` | Therapeutic + dosage chips |
| `frontend/src/components/search/advanced-filters-sheet.tsx` | Advanced filter bottom sheet |
| `frontend/src/components/search/sort-select.tsx` | Sort dropdown |
| `frontend/src/components/search/generic-alternatives.tsx` | Generic substitutes row |
| `frontend/src/lib/search-constants.ts` | Filter/sort constants |
| `frontend/src/lib/search-params.ts` | URL param helpers + filter count |
| `frontend/src/stores/recent-searches-store.ts` | Recent search persistence |
| `frontend/src/hooks/use-debounced-value.ts` | Debounce hook |
| `frontend/src/hooks/use-geolocation.ts` | Browser geolocation |
| `frontend/src/hooks/use-medicine-suggestions.ts` | Autocomplete + alternatives queries |
| `frontend/src/i18n/locales/en.json` | ~40 new search/home keys |
| `frontend/src/i18n/locales/bn.json` | Bengali translations (default) |
| `frontend/tests/search-params.test.ts` | Param/filter unit tests |

---

## API Changes

### `GET /api/v1/listings/search` — new query params

| Param | Type | Description |
|-------|------|-------------|
| `dosageForm` | enum | `TABLET`, `CAPSULE`, `SYRUP`, etc. |
| `minRating` | number | Minimum pharmacy rating |
| `verifiedOnly` | boolean | Verified pharmacies only |
| `inStockOnly` | boolean | `availableQty > 0` |
| `minAvailableQty` | number | Overstock filter (e.g. 50) |
| `maxExpiryDays` | number | Short expiry (e.g. 30) |
| `sortBy` | string | + `rating`, `distance`, `recommended` |
| `latitude` / `longitude` / `radiusKm` | number | Geo-radius filter (now applied) |

### `GET /api/v1/medicines/:id/alternatives` — new endpoint

Returns medicines with the same `genericName` (case-insensitive), excluding the requested ID.

---

## Database Changes

**None.** All filters use existing Prisma schema fields (`dosageForm`, `latitude`, `longitude`, `rating`, `availableQty`, `expiryDate`, `genericName`).

---

## Translation Updates

- **Namespace `search`:** 40+ new keys (autocomplete, recent searches, therapeutic/dosage chips, advanced filters, sort options, voice search, result actions)
- **Namespace `home`:** Updated quick filter keys (`filterShortExpiry`, `filterBigDiscount`, `filterOverstock`, `filterNearby` → Near Me)

---

## Test Report

| Suite | Result |
|-------|--------|
| Backend tests | **34 passed** (11 files) |
| Frontend tests | **26 passed** (8 files) |
| Backend lint (`tsc --noEmit`) | ✅ Pass |
| Frontend lint (`tsc --noEmit`) | ✅ Pass |
| Frontend build (`vite build`) | ✅ Pass |

---

## Build Report

```
frontend: vite build — success (2.99s)
backend: tsc --noEmit — success
```

---

## GitHub CI / Vercel Preview

Status will be updated after push. CI runs backend + frontend test jobs on PR.

---

## Next Phase

**Phase 4 — Medicine Offers + Comparison** (full multi-seller comparison screen, offer detail enhancements)
