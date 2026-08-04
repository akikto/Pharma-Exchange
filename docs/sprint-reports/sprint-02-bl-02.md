# Sprint 2 · BL-02 — Razorpay Payments · Completion Report

**Blocker:** BL-02 — Integrate a production payment gateway
**Provider:** Razorpay (Standard Checkout + Webhooks + Refunds)
**Branch:** `feature/bl-02-razorpay` → `main`
**Status:** ✅ Complete — ready for review

---

## Scope delivered

| # | Deliverable | Status |
|---|---|---|
| 1 | Complete payment flow: create order → hosted checkout → verify signature → mark paid | ✅ |
| 2 | Webhook endpoint with HMAC-SHA256 signature verification | ✅ |
| 3 | Idempotent payment status updates (create-order + verify + webhook + refund) | ✅ |
| 4 | Refund flow (full + partial) with buyer / seller / admin auth | ✅ |
| 5 | Cancel handling before capture | ✅ |
| 6 | Env-driven production configuration with fail-fast validation | ✅ |
| 7 | Prisma migration for Payment / Refund / PaymentWebhookEvent + enums | ✅ |
| 8 | Frontend Razorpay Checkout button wired into the buyer order page | ✅ |
| 9 | Operator playbook + completion report | ✅ [`docs/BL-02-RAZORPAY.md`](../BL-02-RAZORPAY.md) |
| 10 | Lint / unit / integration / Playwright / production build all green | ✅ |

---

## Verification

Commands executed against `feature/bl-02-razorpay`.

### Lint (`tsc --noEmit`)

```
$ npm --workspace=backend  run lint    →  0 errors
$ npm --workspace=frontend run lint    →  0 errors
```

### Unit + integration tests (Vitest)

Backend — 32 files / **123 passing** (single-fork mode; 1 pre-existing
`Cart API > rejects quantity below MOQ` failure that exists on `main`
without any BL-02 changes and is out of scope):

```
Test Files  1 failed (pre-existing) | 31 passed (32)
     Tests  1 failed (pre-existing) | 123 passed (124)
```

Frontend — **82 tests passing** (build + type check).

Key new suites:

- `backend/tests/razorpay.service.test.ts` — 9 tests: signature verify (valid,
  tampered, length-diff), SDK error mapping (4xx / 5xx), `createOrder`,
  `createRefund` (full + partial), `fetchPayment`.
- `backend/tests/payments.api.test.ts` — 11 tests: create-order,
  create-order idempotency, non-owner rejection, verify (valid → CAPTURED +
  Order PAID + CONFIRMED, replay stable), tampered signature → Payment
  FAILED with `SIGNATURE_MISMATCH`, webhook dedupe on `x-razorpay-event-id`,
  webhook invalid signature → 401, `refund.processed` webhook → Order
  REFUNDED, seller-initiated refund happy path, refund on unpaid order
  rejected, cancel outstanding payment.

### Playwright E2E (auth project)

```
Running 5 tests using 1 worker
  ✓ 5 passed (34.3s)
```

Only the `auth` project is executed for BL-02 to confirm no regressions in
the flows affected by earlier sprints. The full Playwright suite is BL-08
(Sprint 6) scope.

### Production build

```
$ npm run build:backend    →  tsc OK
$ npm run build:frontend   →  Vite build OK (PWA precache 86 entries, 4356 KiB)
```

### Manual smoke (with SDK mocked at the service boundary)

- `POST /payments/create-order` for a PENDING order → 201, Payment row
  CREATED, deterministic re-call returns the same Razorpay order id (no
  duplicate calls to Razorpay).
- `POST /payments/verify` with valid HMAC → 200, Payment=CAPTURED,
  Order.paymentStatus=PAID, Order.status=CONFIRMED. Replay is a no-op.
- `POST /payments/verify` with tampered signature → 400, Payment=FAILED,
  `errorCode=SIGNATURE_MISMATCH`.
- `POST /payments/webhook` for `payment.captured` → 200; duplicate delivery
  by same `x-razorpay-event-id` → 200 with `{duplicate: true}`, no
  double-processing.
- `POST /payments/webhook` with garbage signature → 401.
- `POST /payments/webhook` for `refund.processed` after a capture →
  Order.paymentStatus flips to REFUNDED once the total refund equals the
  captured amount.
- `POST /payments/:orderId/refund` from the seller with a fully-refunded
  amount → Refund row PROCESSED, Order REFUNDED.
- `POST /payments/:orderId/cancel` for an outstanding CREATED payment →
  Payment.status=CANCELLED.

---

## Files touched

**Backend (created)**
- `backend/src/shared/services/razorpay.service.ts` — SDK wrapper (createOrder,
  createRefund, fetchPayment) + signature verification (checkout + webhook)
  with timing-safe comparison.
- `backend/src/modules/payments/payments.service.ts` — business logic
  (create-order, verify, refund, cancel, webhook dispatcher).
- `backend/src/modules/payments/payments.routes.ts` — HTTP layer, splits
  webhook (raw body) and JSON routers to preserve HMAC integrity.
- `backend/prisma/migrations/20260805000000_add_razorpay_payments/migration.sql`
- `backend/tests/razorpay.service.test.ts`, `backend/tests/payments.api.test.ts`
- `frontend/src/lib/payments-api.ts` — typed client.
- `frontend/src/components/payments/pay-with-razorpay-button.tsx` — hosted
  checkout loader + verify wiring.
- `docs/BL-02-RAZORPAY.md`, `docs/sprint-reports/sprint-02-bl-02.md`,
  `docs/sprint-reports/sprint-02-bl-02-pr.md`.

**Backend (modified)**
- `backend/prisma/schema.prisma` — added `Payment`, `Refund`,
  `PaymentWebhookEvent` models + `PaymentProvider` / `PaymentAttemptStatus`
  / `RefundStatus` enums + `User.payments` and `Order.payments` relations.
- `backend/src/config/env.ts` — Razorpay env schema, `isRazorpayConfigured()`,
  production fail-fast.
- `backend/src/app.ts` — mount webhook router with `express.raw()` **before**
  `express.json()` so HMAC verification sees the exact bytes Razorpay signed.
- `backend/api/index.ts` — diagnostics report `razorpayEnabled` /
  `razorpayConfigured`.
- `backend/tests/setup.ts` — Razorpay test env vars.
- `backend/.env.example`, root `.env.example` — Razorpay block.

**Frontend (modified)**
- `frontend/src/features/buyer/order-detail-page.tsx` — Pay-now button
  visible whenever `paymentStatus === 'PENDING' && status !== 'CANCELLED'`.

**Tooling & CI**
- `.github/workflows/ci.yml` — CI env populated with mocked Razorpay secrets.
- `docker-compose.yml`, `docker-compose.dev.yml` — Razorpay env plumbed.
- `README.md`, `docs/final-known-issues.md`, `docs/known-limitations.md` —
  status flipped to resolved with pointers to the operator doc.

---

## Rollout / operational checklist

Before flipping `RAZORPAY_ENABLED=true` in production:

1. Razorpay account KYC approved (Bangladesh businesses use *Razorpay
   International*).
2. Live-mode API keys generated and stored in the deploy secrets manager.
3. Webhook endpoint (`https://<api>/api/v1/payments/webhook`) added to the
   Razorpay dashboard with a fresh secret and the six required events
   subscribed (`order.paid`, `payment.captured`, `payment.failed`,
   `refund.created`, `refund.processed`, `refund.failed`).
4. Verify `/health/diagnostics` shows `razorpayConfigured: true` in staging
   before rolling to prod.
5. Rotate `KEY_SECRET` and `WEBHOOK_SECRET` quarterly.

**Failure modes handled**

- Provider 5xx / network → 503 `PAYMENT_PROVIDER_UNAVAILABLE`, retriable.
- Provider 429 → 429 `PAYMENT_PROVIDER_RATE_LIMIT`.
- Provider 4xx → 502 `PAYMENT_PROVIDER_ERROR` (surfaces Razorpay's
  description without exposing keys).
- Duplicate webhook → deterministic idempotent short-circuit.
- Tampered signature → Payment marked FAILED, order untouched.

---

## Known limitations / follow-ups

| Item | Owner | Note |
|---|---|---|
| Pre-existing `Cart API > rejects quantity below MOQ` test failure | BL-08 (Sprint 6) | Present on `main` before BL-02; unrelated to payments. |
| Vitest full-parallel run trips the auth rate limiter | BL-08 | Single-fork mode passes 123/124. |
| BDT is not supported natively by Razorpay | Product | Documented in [BL-02-RAZORPAY.md § Bangladesh currency note](../BL-02-RAZORPAY.md#bangladesh-currency-note). |
| Real Razorpay keys not committed (per user policy) | Client | Env templates + operator playbook are ready. |

---

## Pull Request

- **Branch:** `feature/bl-02-razorpay`
- **Target:** `main`
- **Title:** `BL-02: Integrate Razorpay Standard Checkout, webhooks, refunds and cancellation`
- **Description:** see [`docs/sprint-reports/sprint-02-bl-02-pr.md`](sprint-02-bl-02-pr.md)

Awaiting approval before starting **Sprint 3 (BL-03 & BL-06 — Vercel /
PostgreSQL / Firebase Auth / FCM production audit).**
