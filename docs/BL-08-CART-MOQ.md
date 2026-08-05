# BL-08 · Cart MOQ Validation

**Sprint:** 6  
**Branch:** `feature/bl-08-cart-moq`

---

## Overview

BL-08 hardens cart and checkout validation with seller-specific minimum order quantity (MOQ) rules, structured error codes, and deterministic tests. Each listing carries its own MOQ set by the seller; validation is enforced on add, update, cart read, and buy-request checkout.

---

## Validation rules

| Rule | Code | When |
|---|---|---|
| Quantity ≥ listing MOQ | `MOQ_VIOLATION` | Add, PATCH, checkout |
| Quantity ≤ available stock | `INSUFFICIENT_STOCK` | Add, PATCH, checkout |
| Listing status = ACTIVE | `LISTING_UNAVAILABLE` | Add, PATCH, checkout, cart read |
| Buyer ≠ seller pharmacy | `SELF_PURCHASE` | Add to cart |

---

## Architecture

```
cart.validation.ts (shared logic)
    ├── cart.service.ts      → add / update / getCart (+ validationIssues)
    └── buyRequest.service.ts → checkout validation
```

### GET `/api/v1/cart` response

```json
{
  "items": [...],
  "groupedBySeller": { "...": [...] },
  "validationIssues": [
    {
      "cartItemId": "...",
      "listingId": "...",
      "medicineName": "Napa",
      "quantity": 3,
      "code": "MOQ_VIOLATION",
      "message": "Minimum order quantity is 10",
      "moq": 10
    }
  ]
}
```

---

## Frontend

- `frontend/src/lib/cart-validation.ts` mirrors backend rules for client-side pre-checks.
- `CartTabPanel` validates before sending buy requests and surfaces server `validationIssues`.
- `SellerCartGroup` shows per-item error text and disables checkout when issues exist.
- `QuantityStepper` already respects `min={listing.moq}` — unchanged.

---

## Tests

| File | Coverage |
|---|---|
| `backend/tests/cart.validation.test.ts` | Unit tests for MOQ, stock, inactive listing |
| `backend/tests/cart.integration.test.ts` | API integration (fixed deterministic MOQ picker) |
| `frontend/tests/cart-validation.test.ts` | Client-side validation helpers |

### Integration test fix

The pre-existing flake sent `quantity: 1` regardless of listing MOQ. When a listing had `moq: 1`, the test expected 400 but received 200. The fix:

1. Pick a listing with `moq > 1`.
2. Send `listingMoq - 1` for below-MOQ assertions.

---

## API error shape

```json
{
  "error": "Minimum order quantity is 10",
  "code": "BAD_REQUEST",
  "details": {
    "code": "MOQ_VIOLATION",
    "moq": 10
  }
}
```
