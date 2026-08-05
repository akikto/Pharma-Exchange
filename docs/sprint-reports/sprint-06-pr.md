# BL-08: Cart MOQ validation and checkout hardening

Closes: **BL-08** (Sprint 6)

## Summary

Fixes the pre-existing flaky `Cart API > rejects quantity below MOQ` integration test and completes production-ready cart validation with seller-specific MOQ rules, structured error codes, and improved checkout error handling.

## What's in this PR

### Backend
- New `cart.validation.ts` — shared MOQ, stock, and listing-status checks.
- `GET /cart` now returns `validationIssues` for stale/invalid cart lines.
- `POST/PATCH /cart` and buy-request checkout return structured `details.code` (`MOQ_VIOLATION`, `INSUFFICIENT_STOCK`, `LISTING_UNAVAILABLE`).
- Integration tests pick listings with `moq > 1` and assert `listingMoq - 1` for below-MOQ cases.

### Frontend
- New `cart-validation.ts` for client-side pre-checkout checks.
- Cart panel blocks buy-request send when validation fails; shows per-item errors.
- Checkout button disabled when seller group has validation issues.

### Docs
- `docs/BL-08-CART-MOQ.md`
- Sprint 6 reports

## Test evidence

| Gate | Result |
|---|---|
| Typecheck (frontend + backend) | ✅ 0 errors |
| Frontend Vitest | ✅ 91/91 |
| Backend cart/validation unit tests | ✅ 6/6 (+ 6 DB integration tests skipped without PostgreSQL) |
| Production builds | ✅ |

## Out of scope

- Playwright E2E / rate-limiter CI (separate BL-08 item in PRD roadmap).
- Bangla translations for new cart validation strings.
