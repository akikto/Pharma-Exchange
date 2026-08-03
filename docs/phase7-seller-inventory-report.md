# Phase 7 — Seller Inventory Management Report

**Branch:** `cursor/phase7-seller-inventory-239a`  
**Base:** `cursor/phase6-buy-requests-orders-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 7.2–7.3 | Stat chips + tabs | ❌ Flat read-only list | ✅ Active/paused/sold-out/low-stock chips and tab filters |
| 7.4 | Dashboard search | ❌ Missing | ✅ Search by name, generic, company, batch |
| 7.8–7.10 | Pause/sold-out/delete | 🟡 APIs only | ✅ Row action buttons wired |
| 7.11 | Quick restock | ❌ Missing | ✅ +50 restock button and `POST /:id/restock` |
| 7.12–7.13 | Low-stock threshold | ❌ Missing | ✅ `lowStockThreshold` on Listing; daily cron alerts |
| 7.14–7.15 | CSV export + share | ❌ Missing | ✅ `GET /inventory/export`; download + Web Share |
| 7.16–7.17 | Auth prompt + status pill | 🟡 Redirect only | ✅ Guest login banner; signed-in pill on dashboard |

---

## Remaining Gaps (Future Phases)

| Feature | Phase |
|---------|-------|
| Incoming requests / order history tabs on inventory hub | Optional polish |
| Inline threshold edit dialog on inventory rows | Covered partially via listing form |
| Real-time low-stock push (vs daily cron) | Phase 15 |

---

## Files Changed

### Backend

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | `lowStockThreshold Int?` on `Listing` |
| `backend/prisma/migrations/20260803000000_add_low_stock_threshold/` | Migration SQL |
| `backend/src/modules/listing/listing.service.ts` | Stats, export, restock, sold-out, search, low-stock helpers |
| `backend/src/modules/listing/listing.validation.ts` | Inventory query, restock, threshold schemas |
| `backend/src/modules/listing/listing.controller.ts` | Stats, export, restock, sold-out handlers |
| `backend/src/modules/listing/listing.routes.ts` | Inventory stats/export/restock/sold-out routes |
| `backend/src/jobs/index.ts` | Daily low-stock notification cron |
| `backend/tests/listing.inventory.test.ts` | Unit tests for threshold helpers |
| `backend/tests/inventory.integration.test.ts` | Integration tests for inventory API |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/features/seller/seller-inventory-page.tsx` | Full inventory hub UI |
| `frontend/src/features/seller/seller-dashboard-page.tsx` | Auth prompt, status pill, guest access |
| `frontend/src/features/seller/listing-form-page.tsx` | Optional low-stock threshold field |
| `frontend/src/hooks/use-api.ts` | Inventory stats, mutations, export |
| `frontend/src/lib/inventory-utils.ts` | Client-side low-stock helpers |
| `frontend/src/lib/api.ts` | `getText` for CSV download |
| `frontend/src/types/index.ts` | `lowStockThreshold` on `Listing` |
| `frontend/src/app/router.tsx` | Guest-accessible `/seller`; inventory stays protected |
| `frontend/tests/inventory-utils.test.ts` | Unit tests |
| `frontend/src/i18n/locales/bn.json` | Bengali-first inventory strings |
| `frontend/src/i18n/locales/en.json` | English strings |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/listings/inventory` | Seller listings with `status`, `q`, `filter=low_stock` |
| GET | `/listings/inventory/stats` | Counts: active, paused, soldOut, lowStock |
| GET | `/listings/inventory/export` | CSV download |
| POST | `/listings/:id/restock` | Add quantity (default +50) |
| POST | `/listings/:id/sold-out` | Mark sold out with qty 0 |

---

## Quality Gates

| Check | Result |
|-------|--------|
| Backend tests | 56 passed |
| Frontend tests | 44 passed |
