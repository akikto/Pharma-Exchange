# BL-02: Integrate Razorpay Standard Checkout, webhooks, refunds and cancellation

Closes: **BL-02** (Launch Blockers · Sprint 2)

## Summary

Adds production Razorpay integration: hosted checkout, HMAC-verified
`/payments/verify`, HMAC-verified webhook with `x-razorpay-event-id`
dedupe, full + partial refunds, and pre-capture cancellation. All Razorpay
network calls go through a single service so key material never leaks and
the SDK is trivially mockable in tests.

## What's in this PR

- **Prisma schema:** new `Payment`, `Refund`, `PaymentWebhookEvent` models
  with idempotency indexes + `PaymentProvider` / `PaymentAttemptStatus` /
  `RefundStatus` enums. Migration
  `20260805000000_add_razorpay_payments`.
- **Backend service** (`shared/services/razorpay.service.ts`) — SDK wrapper
  for orders/refunds/payments plus timing-safe HMAC verification of the
  checkout callback and webhook payloads.
- **Payments module** (`modules/payments/`) — six endpoints:
  - `POST /payments/create-order` (buyer)
  - `POST /payments/verify` (buyer, HMAC)
  - `POST /payments/:orderId/cancel` (buyer, pre-capture)
  - `POST /payments/:orderId/refund` (buyer / seller / admin)
  - `GET  /payments/order/:orderId` (buyer / seller / admin)
  - `POST /payments/webhook` (Razorpay, raw body + HMAC + event dedupe)
- **Boot-time validation:** if `NODE_ENV=production` and
  `RAZORPAY_ENABLED=true` the process exits when any of
  `RAZORPAY_KEY_ID` / `KEY_SECRET` / `WEBHOOK_SECRET` are missing.
- **Order lifecycle:** capture flips `Order.paymentStatus PENDING → PAID`
  and — if the order was still `CREATED` — advances it to `CONFIRMED`. Full
  refund flips to `REFUNDED`. Seller pipeline (`CONFIRMED → PACKED → …`) is
  untouched.
- **Frontend:** `PayWithRazorpayButton` loads the hosted
  `checkout.razorpay.com/v1/checkout.js` on demand, opens the modal with the
  server-provided options, and forwards the response to `/payments/verify`.
  Wired into `features/buyer/order-detail-page.tsx`.
- **Docs:** operator setup guide at
  [`docs/BL-02-RAZORPAY.md`](docs/BL-02-RAZORPAY.md) and completion report
  at [`docs/sprint-reports/sprint-02-bl-02.md`](docs/sprint-reports/sprint-02-bl-02.md).
- **CI / docker / env examples** updated.

## Test evidence

| Gate | Result |
|---|---|
| `npm --workspace=backend  run lint` | ✅ 0 errors |
| `npm --workspace=frontend run lint` | ✅ 0 errors |
| Backend Vitest (single-fork) | ✅ 123 passed / 1 pre-existing unrelated failure |
| Frontend Vitest | ✅ 82 passed |
| Playwright `--project=auth` | ✅ 5/5 |
| `npm run build:backend` | ✅ |
| `npm run build:frontend` | ✅ |

## Deployment notes

1. Obtain Razorpay API keys and configure the webhook with the six events
   listed in the operator doc.
2. Set env vars in the deployment platform:
   `RAZORPAY_ENABLED=true`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
   `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_CURRENCY`.
3. Redeploy — the health check will fail fast if config is incomplete.
4. Smoke test end-to-end with Razorpay test cards before flipping to Live.

## Out of scope

- Full Playwright suite (buyer / seller / admin / orders) — tracked as
  **BL-08 (Sprint 6)**.
- Native BDT payments (bKash / Nagad / SSLCOMMERZ) — documented as a
  follow-up in [BL-02-RAZORPAY.md § Bangladesh currency note].
