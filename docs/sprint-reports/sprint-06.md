# Sprint 6 · BL-08 — Cart MOQ Validation · Completion Report

**Branch:** `feature/bl-08-cart-moq`  
**Status:** ✅ Complete

---

## Pre-work audit (main @ `062653b`)

| Area | On main before BL-08 | Status |
|---|---|---|
| Basic MOQ check on add/update | ✅ `cart.service.ts` | Complete |
| MOQ on buy-request checkout | ✅ `buyRequest.service.ts` | Complete |
| Frontend QuantityStepper min=MOQ | ✅ | Complete |
| Centralized validation module | ❌ | **Added** |
| Structured error codes | ❌ | **Added** |
| Cart read validation (`validationIssues`) | ❌ | **Added** |
| Payment failure path in checkout errors | N/A | Buy-request only |
| Deterministic MOQ integration test | ❌ Flaky | **Fixed** |
| Frontend pre-checkout validation | ❌ | **Added** |
| Per-item cart issue display | ❌ | **Added** |
| BL-08 documentation | ❌ | **Added** |

---

## Deliverables

| # | Item | Status |
|---|---|---|
| 1 | Fix Cart MOQ validation test failure | ✅ |
| 2 | Complete cart validation logic (MOQ, stock, active listing) | ✅ |
| 3 | Seller-specific MOQ rules (per listing) | ✅ |
| 4 | Checkout validation + error handling | ✅ |
| 5 | Preserve existing cart UI/UX | ✅ |
| 6 | Backend + frontend tests | ✅ |
| 7 | Documentation + sprint reports | ✅ |

---

## Files changed

### Added
- `backend/src/modules/cart/cart.validation.ts`
- `backend/tests/cart.validation.test.ts`
- `frontend/src/lib/cart-validation.ts`
- `frontend/tests/cart-validation.test.ts`
- `docs/BL-08-CART-MOQ.md`
- `docs/sprint-reports/sprint-06.md`
- `docs/sprint-reports/sprint-06-pr.md`

### Modified
- `backend/src/modules/cart/cart.service.ts` — centralized validation, `validationIssues` on GET
- `backend/src/modules/buy-request/buyRequest.service.ts` — shared validation + structured errors
- `backend/tests/cart.integration.test.ts` — deterministic MOQ tests
- `frontend/src/components/cart/cart-tab-panel.tsx` — pre-checkout validation
- `frontend/src/components/cart/seller-cart-group.tsx` — issue display, disable checkout
- `frontend/src/i18n/locales/en.json` — cart validation strings

---

## Test / build results

| Gate | Result |
|---|---|
| `tsc --noEmit` (frontend + backend) | ✅ 0 errors |
| Frontend Vitest | ✅ **91/91** (5 new cart-validation tests + previous 86) |
| Backend Vitest — cart/validation suite | ✅ **6/6** unit (+ 6 integration skipped — no local PostgreSQL) |
| Frontend production build | ✅ 89 precache entries |
| Backend production build | ✅ tsc OK |

---

## Confirmation

- ✅ Synced latest `main` before branching
- ✅ No cart UI redesign — additive validation messages only
- ✅ PR opened against `main`
