# Phase 2 — Marketplace Feed (Home) Report

**Branch:** `cursor/phase2-marketplace-feed-239a`  
**Date:** 2026-08-03  
**PRD:** `docs/master-feature-specification.md` § Phase 2  
**Base:** Phase 1 (`cursor/phase1-nav-shell-i18n-239a`)

---

## Feature Status

| PRD ID | Feature | Pre-Phase 2 | Post-Phase 2 |
|--------|---------|-------------|--------------|
| 2.1 | Live offers feed | ✅ Implemented | ✅ Implemented (infinite scroll + API) |
| 2.2 | Grid view | ✅ Implemented | ✅ Implemented (2-col grid + view toggle) |
| 2.3 | Catalog comparison view | ❌ Missing | ✅ Implemented (grouped by medicine, seller count, best price) |
| 2.4 | Pull-to-refresh | ❌ Missing | ✅ Implemented (touch pull + manual refresh button) |
| 2.5 | Shop header | ❌ Missing | ✅ Implemented (pharmacy/marketplace, verified badge, location, Made in India) |
| 2.6 | Inline search bar | 🟡 Partial | ✅ Implemented (inline input, result count, clear filters, full search link) |
| 2.7 | Dedicated search screen | ✅ Implemented | ✅ Implemented (`/search` unchanged) |
| 2.8 | Barcode scan button | ❌ Missing | ✅ Implemented (UI placeholder + coming-soon toast) |
| 2.9 | Watchlist shortcut + badge | ❌ Missing | 🟡 Partial (header shortcut + localStorage badge; full watchlist = Phase 9) |
| 2.10 | Cart shortcut + badge | 🟡 Partial (nav only) | ✅ Implemented (header cart icon + badge) |
| 2.11 | Notifications icon | 🟡 Partial | ✅ Implemented (TopBar bell + unread badge on home) |
| 2.12 | Bulk procurement banner | ❌ Missing | 🟡 Partial (dismissible CTA → bulk modal stub; full form = Phase 8) |

---

## Implemented Features

- **Catalog comparison view** — `groupListingsByMedicine()` + `CatalogGroupCard` with seller count and best price
- **Grid / Catalog view toggle** — segmented control on home feed
- **Pull-to-refresh** — `usePullToRefresh` hook + `PullToRefreshIndicator` + refresh invalidates TanStack Query
- **Shop header** — active pharmacy from `/pharmacies/me` or marketplace fallback; verified badge; city; Made in India badge
- **Inline search** — filters feed client-side; shows result count; clear filters; link to `/search`
- **Quick filters wired** — All, Nearby (city match), New, Discounted (minDiscount API param)
- **Home header actions** — barcode placeholder, watchlist (modal stub), cart with badges
- **Bulk procurement banner** — dismissible, opens bulk modal stub
- **i18n** — 30+ new `home.*` translation keys (BN/EN)

---

## Partial Features

| Feature | What works | Remaining |
|---------|------------|-----------|
| Watchlist shortcut | Header heart + badge from `watchlist-store` (localStorage) | No API, no watchlist screen, no add/remove from cards (Phase 9) |
| Bulk banner | Dismissible CTA opens coming-soon bulk modal | Full procurement form (Phase 8) |
| Catalog compare tap | Opens comparison modal stub | Full multi-seller comparison screen (Phase 4) |
| Nearby filter | Client-side city match when pharmacy has city | Geo/radius API (Phase 3) |
| Barcode scan | Placeholder button + toast | Scanner integration (future) |

---

## Remaining Gaps (later phases)

- AI match refresh on pull (Phase 13)
- Watchlist add/remove on listing cards (Phase 9)
- Full price comparison screen from catalog cards (Phase 4)
- Bulk procurement form (Phase 8)
- Geo-radius "near me" with backend (Phase 3)

---

## Files Changed

### New
- `frontend/src/lib/catalog-groups.ts`
- `frontend/src/stores/watchlist-store.ts`
- `frontend/src/hooks/use-pull-to-refresh.ts`
- `frontend/src/components/home/shop-header.tsx`
- `frontend/src/components/home/home-header-actions.tsx`
- `frontend/src/components/home/bulk-procurement-banner.tsx`
- `frontend/src/components/home/catalog-group-card.tsx`
- `frontend/src/components/home/pull-to-refresh-indicator.tsx`
- `frontend/tests/catalog-groups.test.ts`
- `docs/phase2-marketplace-feed-report.md`

### Modified
- `frontend/src/features/home/home-page.tsx` — full Phase 2 feed
- `frontend/src/i18n/locales/bn.json`, `en.json` — home strings

---

## API Changes

**None.** Reuses existing `GET /listings/search` and `GET /pharmacies/me`.

---

## Database Changes

**None.**

---

## Test Results

| Suite | Result |
|-------|--------|
| Frontend tests | **20/20** pass (+3 catalog-groups) |
| Backend tests | **24/24** pass (unchanged) |

New tests:
- `catalog-groups.test.ts` — grouping, search filter, nearby city filter

---

## Build Report

| Check | Result |
|-------|--------|
| `npm run build` | ✅ Pass |
| `npm run lint` (tsc) | ✅ Pass |
| Home page bundle | 13.98 KB (gzip 4.48 KB) |

---

## GitHub CI / Vercel

Pending on PR creation.

---

## Next Phase

**Phase 3 — Search & Discovery + Filtering & Sorting**
