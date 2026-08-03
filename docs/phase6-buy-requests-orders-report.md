# Phase 6 — Buy Requests & Orders Report

**Branch:** `cursor/phase6-buy-requests-orders-239a`  
**Base:** `cursor/phase5-cart-checkout-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 6.1 | Buy request dialog | 🟡 Inline in shell-modals | ✅ Reusable `BuyRequestDialog` component |
| 6.3 | Tabbed cart hub | ❌ Separate routes | ✅ `/cart` with Cart / Orders / Requests tabs |
| 6.5 | Order search & filters | ❌ Missing | ✅ Status chips + search on orders & requests tabs |
| 6.6 | Order statistics | ❌ Missing | ✅ Summary cards on buyer orders tab |
| 6.7 | Reorder | ❌ Missing | ✅ Reorder button adds items back to cart |
| 6.8–6.9 | Receipt + share | ❌ Missing | ✅ `OrderReceiptDialog` with download + Web Share |
| 6.11–6.12 | Status steppers | ❌ Text history only | ✅ `StatusStepper` on order & buy request detail |
| 6.13 | Map tracker | ❌ Missing | ✅ Simulated map in `TrackingDialog` |
| 6.14 | Tracking dialog | ❌ Missing | ✅ Track button on order cards + detail |

---

## Remaining Gaps (Future Phases)

| Feature | Phase |
|---------|-------|
| Leave review post-delivery CTA | Phase 10+ |
| Real GPS tracking | Not planned (simulated only) |
| Buyer pending request badge on nav | Optional polish |

---

## Files Changed

### Frontend

| File | Change |
|------|--------|
| `frontend/src/features/buyer/requests-hub-page.tsx` | Tabbed Cart / Orders / Requests hub |
| `frontend/src/features/buyer/cart-page.tsx` | Hub entry + legacy route redirects |
| `frontend/src/components/cart/cart-tab-panel.tsx` | Extracted cart tab content |
| `frontend/src/components/orders/orders-tab-panel.tsx` | Orders list, filters, stats, reorder, track |
| `frontend/src/components/orders/buy-requests-tab-panel.tsx` | Buy requests list + filters |
| `frontend/src/components/orders/status-stepper.tsx` | Visual lifecycle stepper |
| `frontend/src/components/orders/order-receipt-dialog.tsx` | Receipt view + share/download |
| `frontend/src/components/orders/tracking-dialog.tsx` | Simulated shipment map |
| `frontend/src/components/buy-request/buy-request-dialog.tsx` | Reusable buy request modal |
| `frontend/src/features/buyer/order-detail-page.tsx` | Stepper, receipt, track, reorder, chat, i18n |
| `frontend/src/features/buyer/buy-request-detail-page.tsx` | Stepper, chat, i18n |
| `frontend/src/lib/order-utils.ts` | Filters, stats, receipt builder |
| `frontend/src/hooks/use-hub-role.ts` | Seller/buyer role for hub tabs |
| `frontend/src/components/layout/shell-modals.tsx` | Uses `BuyRequestDialog` |
| `frontend/src/components/layout/request-bottom-sheet.tsx` | Links to hub tabs |
| `frontend/src/types/index.ts` | `listingId` on order items |
| `frontend/tests/order-utils.test.ts` | Unit tests |
| `frontend/src/i18n/locales/bn.json` | Bengali-first strings |
| `frontend/src/i18n/locales/en.json` | English strings |

---

## Routes

| Path | Behavior |
|------|----------|
| `/cart` | Hub — Cart tab (default) |
| `/cart?tab=orders` | Hub — Orders tab |
| `/cart?tab=requests` | Hub — Requests tab |
| `/orders`, `/buy-requests` | Redirect to hub tabs |
| `/orders/:id`, `/buy-requests/:id` | Detail pages (unchanged) |

---

## Quality Gates

| Check | Result |
|-------|--------|
| Backend tests | 47 passed |
| Frontend tests | 41 passed |
| Lint | Pass |
