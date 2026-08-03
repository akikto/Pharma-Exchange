# Phase 4 — Medicine Offers & Multi-Seller Price Comparison Report

**Branch:** `cursor/phase4-offers-comparison-239a`  
**Base:** `cursor/phase3-search-filters-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

### Medicine Offer Display

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 4.1 | Offer cards (list) | 🟡 Partial | ✅ `OfferCard` list variant with full details |
| 4.2 | Offer grid cards | ✅ Implemented | ✅ Enhanced with verified badge, urgency cues, actions |
| 4.3 | Watchlist toggle | 🟡 Partial (search only) | ✅ On offer cards + detail page |
| 4.4 | Price trend dialog | ❌ Missing | ✅ Simulated 30-day bar chart |
| 4.5 | Quick contact (Chat, Phone, WhatsApp) | 🟡 Partial (chat only) | ✅ `ContactActions` component |
| 4.6 | Direct buy request CTA | 🟡 Partial (detail only) | ✅ Primary CTA on offer cards + comparison |
| 4.7 | Low-stock / expiry visual cues | 🟡 Partial (expiry only) | ✅ Low-stock badge + urgency border |

### Multi-Seller Comparison

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 4.8 | Comparison screen | ❌ Modal stub | ✅ `/medicine/:medicineId/compare` |
| 4.9 | Comparison sorting | ❌ Missing | ✅ Price, expiry, distance |
| 4.10 | Price comparison + savings | ❌ Missing | ✅ Ranked rows with savings highlights |
| 4.11 | Buy/chat from comparison | ❌ Missing | ✅ Per-row Buy Now + Message |
| 4.12 | Catalog comparison entry | 🟡 Partial (stub modal) | ✅ Links to comparison screen |

---

## Remaining Gaps

| Feature | Status | Notes |
|---------|--------|-------|
| Watchlist screen | 🟡 Partial | Toggle works; dedicated screen = Phase 9 |
| Price trend data | ⚠ Simulated | Mock 30-day chart; real history needs backend |
| Phone/WhatsApp | ⚠ Depends on seller phone | Uses `user.phone` when available in API |
| Distance sort | ⚠ Needs geolocation | Browser permission required |
| Seller-configurable low-stock threshold | ❌ Missing | Fixed threshold (Phase 7) |

---

## Files Changed

### Backend

| File | Change |
|------|--------|
| `backend/src/modules/listing/listing.service.ts` | `compareByMedicine()`, seller phone in `getById` |
| `backend/src/modules/listing/listing.validation.ts` | `compareListingsSchema` |
| `backend/src/modules/listing/listing.controller.ts` | `compare` handler |
| `backend/src/modules/listing/listing.routes.ts` | `GET /compare` |
| `backend/tests/listing.search.test.ts` | Compare endpoint tests |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/components/offers/offer-card.tsx` | Full offer card (grid + list) |
| `frontend/src/components/offers/contact-actions.tsx` | Chat, phone, WhatsApp |
| `frontend/src/components/offers/price-trend-dialog.tsx` | Price trend chart |
| `frontend/src/components/listing-card.tsx` | Delegates to OfferCard |
| `frontend/src/features/medicine/comparison-page.tsx` | Full comparison screen |
| `frontend/src/features/medicine/medicine-detail-page.tsx` | Compare, watchlist, trend, contacts |
| `frontend/src/components/home/catalog-group-card.tsx` | Links to comparison route |
| `frontend/src/hooks/use-listing-compare.ts` | Compare API hook |
| `frontend/src/lib/offer-utils.ts` | Savings, low-stock, trend, contact helpers |
| `frontend/src/app/router.tsx` | Comparison route |
| `frontend/src/types/index.ts` | Pharmacy user phone, distanceKm |
| `frontend/tests/offer-utils.test.ts` | Unit tests |

---

## API Changes

### New: `GET /api/v1/listings/compare`

| Param | Type | Description |
|-------|------|-------------|
| `medicineId` | uuid | Required — medicine to compare |
| `sortBy` | `price` \| `expiry` \| `distance` | Default `price` |
| `latitude` / `longitude` | number | Optional — for distance sort |

**Response:** `{ medicine, listings[], stats: { sellerCount, lowestPrice, highestPrice } }`

### Extended: `GET /api/v1/listings/:id`

Pharmacy include now returns `user.phone` for contact actions.

---

## Database Changes

**None.**

---

## Translation Updates

New namespaces `offer` and `compare` in `bn.json` (default) and `en.json` — 20+ keys each.

---

## Test Report

| Suite | Result |
|-------|--------|
| Backend | **36 passed** (11 files) |
| Frontend | **31 passed** (9 files) |
| Lint | ✅ Both packages |
| Build | ✅ Frontend |

---

## Build Report

```
backend tsc --noEmit — pass
frontend vite build — pass (2.45s)
```

---

## GitHub CI / Vercel Preview

Status updated after push.

---

## Next Phase

**Phase 5 — Cart & Checkout**
