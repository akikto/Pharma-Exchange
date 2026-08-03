# Phase 9 — Watchlist & Price Alerts Report

**Branch:** `cursor/phase9-watchlist-alerts-239a`  
**Base:** `cursor/phase8-bulk-procurement-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 9.1 | Medicine watchlist | 🟡 localStorage only | ✅ `WatchlistItem` model + API |
| 9.2 | Watchlist screen | ❌ Modal stub | ✅ `/watchlist` page with remove + compare |
| 9.3 | Watchlist price summary | ❌ Missing | ✅ Best price, seller count, trend per item |
| 9.4 | Price threshold alerts | ❌ Missing | ✅ `PriceAlert` CRUD API |
| 9.5 | Enable/disable thresholds | ❌ Missing | ✅ Toggle on alerts tab |
| 9.6 | Auto-triggered alerts | ❌ Missing | ✅ Fires on listing create/update |
| 9.7 | Triggered alerts inbox | ❌ Missing | ✅ Alerts tab inbox with dismiss |
| 9.8 | Add to cart from alert | ❌ Missing | ✅ Add to cart on triggered rows |
| 9.9 | Simulate low-price offer | ❌ Missing | ✅ `POST /price-alerts/triggered/simulate` |

---

## Remaining Gaps (Future Phases)

| Feature | Notes |
|---------|-------|
| Real price history / trend charts | Trend uses deterministic mock from medicine id |
| Guest watchlist sync on login | Local store kept; API sync on toggle when authenticated |
| Push notification category for price alerts | Uses SYSTEM notification type |

---

## Files Changed

### Backend

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | `WatchlistItem`, `PriceAlert`, `TriggeredAlert` models |
| `backend/src/modules/watchlist/*` | Watchlist + price alert services and routes |
| `backend/src/modules/listing/listing.service.ts` | Evaluate price alerts on create/update |
| `backend/tests/watchlist*.ts` | Unit + integration tests |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/features/watchlist/watchlist-page.tsx` | Watchlist + alerts tabs |
| `frontend/src/hooks/use-watchlist.ts` | API hooks with local fallback |
| `frontend/src/lib/watchlist-utils.ts` | Trend helpers |
| `frontend/src/components/offers/offer-card.tsx` | API-backed watchlist toggle |
| `frontend/src/features/medicine/medicine-detail-page.tsx` | API-backed watchlist toggle |
| `frontend/src/components/home/home-header-actions.tsx` | Navigate to `/watchlist` |
| `frontend/src/app/router.tsx` | `/watchlist` route |
| `frontend/tests/watchlist-utils.test.ts` | Unit tests |
| `frontend/src/i18n/locales/bn.json` | Bengali-first strings |
| `frontend/src/i18n/locales/en.json` | English strings |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/watchlist` | List with price summary |
| POST | `/watchlist` | Add medicine |
| DELETE | `/watchlist/:medicineId` | Remove |
| GET | `/watchlist/ids` | Medicine id list |
| GET/POST/PATCH/DELETE | `/price-alerts` | Threshold CRUD |
| GET | `/price-alerts/triggered` | Triggered inbox |
| POST | `/price-alerts/triggered/simulate` | Demo trigger |
| POST | `/price-alerts/triggered/:id/dismiss` | Dismiss alert |

---

## Quality Gates

| Check | Result |
|-------|--------|
| Backend tests | 67 passed |
| Frontend tests | 47 passed |
| TypeScript lint | Clean |
