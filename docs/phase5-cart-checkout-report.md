# Phase 5 — Cart & Checkout Report

**Branch:** `cursor/phase5-cart-checkout-239a`  
**Base:** `cursor/phase4-offers-comparison-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 5.3 | Quantity adjust in cart | ❌ Display only | ✅ `QuantityStepper` + `PATCH /cart/:id` with MOQ/stock limits |
| 5.5 | Checkout note per seller | ❌ API only | ✅ Note field per seller group on buy request submit |
| 5.7 | Cart in bottom sheet | 🟡 Count only | ✅ Preview items, grand total, quick actions |
| 5.8 | Cart grand total | ❌ Missing | ✅ Sticky footer with total across all sellers |

---

## Additional Improvements

| Area | Change |
|------|--------|
| Collapsible seller groups | Expand/collapse per pharmacy section |
| Chat from cart | Fixed via `pharmacy.userId` in cart API response |
| Post-submit navigation | Navigates to buy request detail (not just list) |
| Backend tests | Cart CRUD integration tests |

---

## Remaining Gaps (Phase 6+)

| Feature | Phase |
|---------|-------|
| Tabbed Cart / Orders / Requests screen | Phase 6 |
| Buy request confirmation modal | Phase 6 |
| Order status steppers | Phase 6 |
| Reorder from order history | Phase 6 |

---

## Files Changed

### Backend

| File | Change |
|------|--------|
| `backend/src/modules/cart/cart.service.ts` | Include `pharmacy.userId` in cart response |
| `backend/tests/cart.integration.test.ts` | Cart add/update/remove tests |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/components/cart/quantity-stepper.tsx` | Reusable MOQ-aware stepper |
| `frontend/src/components/cart/seller-cart-group.tsx` | Collapsible seller section with note + CTA |
| `frontend/src/features/buyer/cart-page.tsx` | Full checkout UX overhaul |
| `frontend/src/components/layout/request-bottom-sheet.tsx` | Cart preview + grand total |
| `frontend/src/lib/cart-utils.ts` | Total/subtotal helpers |
| `frontend/src/i18n/locales/bn.json` | Bengali-first cart/checkout strings |
| `frontend/src/i18n/locales/en.json` | English cart/checkout strings |
| `frontend/tests/cart-utils.test.ts` | Unit tests |

---

## Quality Gates

| Check | Result |
|-------|--------|
| Backend tests | 47 passed |
| Frontend tests | 35 passed |
| Backend lint | Pass |
| Frontend lint | Pass |

---

## Buyer Flow (Design System §3.4)

```
Listing Details → Add to Cart → Cart (qty adjust, notes) → Send Buy Request (per seller) → Buy Request Detail
```

No unified checkout — each seller group sends an independent buy request, matching B2B negotiation model.
