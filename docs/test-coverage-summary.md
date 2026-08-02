# Test Coverage Summary — PharmEx

**Date:** August 2, 2026

## Results

```
Backend:  17 tests — ✅ All pass
Frontend:  7 tests — ✅ All pass
Total:    24 tests
```

## Backend Tests

| File | Coverage Area |
|------|---------------|
| `helpers.test.ts` | Pagination, OTP, price computation |
| `AppError.test.ts` | Error factory methods |
| `security.test.ts` | OTP format, authorization signatures |
| `authz.test.ts` | Order access control logic |
| `business-rules.test.ts` | Buy-request auth, self-purchase rules |
| `health.integration.test.ts` | Health endpoint, 404 handler |

## Frontend Tests

| File | Coverage Area |
|------|---------------|
| `utils.test.ts` | formatPrice, expiry helpers |
| `status-chip.test.tsx` | StatusChip component render |
| `page-role.test.ts` | Seller/buyer route role detection |

## Gaps (Future Work)

| Priority | Area |
|----------|------|
| P1 | Playwright E2E: auth → cart → buy request → order |
| P1 | Supertest integration with test database |
| P2 | Component tests for cart, order detail, listing form |
| P2 | Socket.IO integration tests |

## CI

`.github/workflows/ci.yml` runs build + test on every push/PR.
