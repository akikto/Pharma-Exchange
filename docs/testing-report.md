# Testing Report — PharmEx

**Date:** August 2, 2026

## Summary

| Suite | Framework | Tests | Status |
|-------|-----------|-------|--------|
| Backend unit + integration | Vitest + supertest | 15 | Pass |
| Frontend unit | Vitest + Testing Library | 5 | Pass |
| Integration | — | 0 | Not yet |
| E2E | — | 0 | Not yet |

## Backend Tests

- `tests/helpers.test.ts` — pagination, OTP, price computation
- `tests/AppError.test.ts` — error factory methods
- `tests/security.test.ts` — OTP, authorization signature
- `tests/authz.test.ts` — order/buy-request access logic

## Frontend Tests

- `tests/utils.test.ts` — formatPrice, expiry helpers
- `tests/status-chip.test.tsx` — StatusChip render

## Commands

```bash
npm test
npm run test:backend
npm run test:frontend
```

## Coverage Gaps

1. **P1:** Integration tests (supertest + test DB) for auth and authorization
2. **P1:** Playwright E2E for login, search, cart, buy request
3. **P2:** Component tests for ListingCard, ProtectedRoute, cart page
