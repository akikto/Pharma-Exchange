# BL-02 · Razorpay Payments Integration

**Status:** Complete
**Sprint:** 2 · Launch Blockers
**Owner:** Platform / Payments
**Related endpoints:** `POST /payments/create-order`, `POST /payments/verify`,
`POST /payments/webhook`, `POST /payments/:orderId/refund`,
`POST /payments/:orderId/cancel`, `GET /payments/order/:orderId`

---

## Flow overview

```
Buyer clicks "Pay now"
        │
        ▼
POST /payments/create-order  ─────► Razorpay Orders API ─────► rzp_order_xxx
        │                                                            │
        ▼                                                            │
Server persists Payment(status=CREATED)                              │
        │                                                            │
        ▼                                                            │
Razorpay Standard Checkout opens on the client ◄─────────────────────┘
        │
Buyer completes payment
        │
        ▼
Client posts {razorpay_order_id, razorpay_payment_id, razorpay_signature}
        │
        ▼
POST /payments/verify  ─── HMAC(rzp_order|rzp_payment) with KEY_SECRET
        │
        ├─ valid   → Payment=CAPTURED, Order.paymentStatus=PAID,
        │           Order.status=CONFIRMED (idempotent)
        └─ invalid → Payment=FAILED (errorCode=SIGNATURE_MISMATCH)

Independently, Razorpay POSTs webhook events (payment.captured, order.paid,
payment.failed, refund.created, refund.processed, refund.failed) to
POST /payments/webhook, which:
   1. Verifies HMAC(payload) with WEBHOOK_SECRET
   2. Dedupes on `x-razorpay-event-id`
   3. Updates Payment / Refund / Order rows
```

## Configuration

All configuration is env-driven — see `backend/.env.example`.

| Variable | Required in prod | Description |
|---|---|---|
| `RAZORPAY_ENABLED` | yes | Must be `true` in production. If true, `KEY_ID`/`KEY_SECRET`/`WEBHOOK_SECRET` must all be set (validated at boot). |
| `RAZORPAY_KEY_ID` | yes | Dashboard → *Account & Settings → API Keys*. Format: `rzp_live_xxx` (prod) / `rzp_test_xxx` (test). |
| `RAZORPAY_KEY_SECRET` | yes | Paired with `KEY_ID`. Never expose to the frontend. |
| `RAZORPAY_WEBHOOK_SECRET` | yes | Dashboard → *Settings → Webhooks* → your webhook's Secret. Rotate quarterly. |
| `RAZORPAY_CURRENCY` | no (INR) | ISO-4217 3-letter currency. Razorpay India ↔ INR. Razorpay International can use USD; **BDT is not natively supported** by Razorpay — see "Bangladesh note" below. |

If `RAZORPAY_ENABLED=true` and any required var is missing, the process
**exits during startup**.

## Endpoints

| Endpoint | Method | Auth | Body | Response |
|---|---|---|---|---|
| `/payments/create-order` | POST | Buyer JWT | `{ orderId }` | `201 { paymentId, providerOrderId, keyId, amount(paise), currency }` |
| `/payments/verify` | POST | Buyer JWT | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` | `200 Payment` (includes `order`, `refunds`) |
| `/payments/:orderId/cancel` | POST | Buyer JWT | — | `200 { paymentId, status: 'CANCELLED' }` |
| `/payments/:orderId/refund` | POST | Buyer / Seller / Admin JWT | `{ amount?, reason? }` | `201 { refundId, providerRefundId, status }` |
| `/payments/order/:orderId` | GET | Buyer / Seller / Admin JWT | — | `200 { data: Payment[] }` |
| `/payments/webhook` | POST | Razorpay signed | raw JSON | `200 { received: true }` |

### Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `PAYMENT_PROVIDER_UNAVAILABLE` | 503 | Razorpay network / 5xx |
| `PAYMENT_PROVIDER_RATE_LIMIT` | 429 | Razorpay returned 429 |
| `PAYMENT_PROVIDER_ERROR` | 502 | Razorpay 4xx (bad request, invalid amount, etc.) |
| `SIGNATURE_MISMATCH` | 400 | Callback signature did not match — stored on the Payment row |

## Data model

- **Payment** — one row per checkout attempt for an Order. `providerOrderId` is
  the Razorpay `order_id` (unique). `providerPaymentId` is set on capture.
- **Refund** — one row per Razorpay refund. `providerRefundId` is unique for
  idempotency.
- **PaymentWebhookEvent** — every webhook received, keyed on
  `x-razorpay-event-id`. Duplicate deliveries return `{ received, duplicate: true }`.

Money is stored as `Decimal(12,2)` in the major unit (rupees/dollars).
Razorpay wants paise (integer) — conversion happens at the service boundary.

## Order lifecycle changes

Before BL-02, orders created from an accepted buy request went straight to
`status=CONFIRMED`. That did not change. When the buyer completes payment
we:

- move `Order.paymentStatus` from `PENDING` → `PAID` (or `REFUNDED`)
- if the order was still `CREATED`, advance it to `CONFIRMED`

Seller-driven transitions (`CONFIRMED → PACKED → SHIPPED → DELIVERED`) are
untouched.

## Idempotency and retries

- **create-order**: if a `CREATED` Payment already exists for the order, the
  same Razorpay order is returned — retries never spam Razorpay.
- **verify**: replaying a valid signature returns the current Payment /
  Order state without re-processing.
- **webhook**: `x-razorpay-event-id` is a unique DB constraint; duplicate
  deliveries return `200` and mark the response `duplicate: true`.
- **refund**: `providerRefundId` is unique. When both the sync
  `/payments/:id/refund` path and the `refund.processed` webhook fire, the
  webhook simply updates the existing row.

## Security

- Card data is collected exclusively by Razorpay Checkout — **no PAN, CVV,
  expiry, UPI PIN or wallet credential is ever transmitted to the backend
  or persisted** by Pharma-Exchange.
- Two independent HMAC-SHA256 secrets are used:
  - `KEY_SECRET` — verifies the client callback (`order_id|payment_id`).
  - `WEBHOOK_SECRET` — verifies webhook payloads.
  Rotate both quarterly and after any suspected leak.
- Signature comparisons use `crypto.timingSafeEqual`.
- The webhook route uses `express.raw()` — the payload must be verified
  exactly as received; JSON re-serialisation would break the HMAC.
- All `/payments/*` endpoints (except the webhook) require a valid JWT.

## Bangladesh currency note

Razorpay is an Indian PA/PG licensed by RBI. INR is the default. For a
Bangladesh business:

- If you are onboarded under **Razorpay International**, USD is the safest
  default. Set `RAZORPAY_CURRENCY=USD` and use their FX guidance for BDT
  conversion.
- **BDT is not accepted by Razorpay natively.** Bangladesh-domiciled buyer
  payments will typically go via card networks or wallets that settle in
  USD/INR — display BDT on invoices but charge in the enabled currency.
- If you later need native BDT rails (bKash/Nagad/SSLCOMMERZ), the payments
  module is intentionally provider-agnostic — swap in a second driver and
  the schema / endpoints stay the same.

## Setup checklist

1. **Create the Razorpay account.**
   - Sign up at <https://razorpay.com/> and complete KYC. Bangladesh
     businesses must apply through *Razorpay International*.
2. **Obtain API keys.**
   - Dashboard → *Account & Settings → API Keys* → **Generate Key** in
     **Test** mode. Copy `Key Id` and `Key Secret`.
   - Store as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
3. **Configure a webhook.**
   - Dashboard → *Settings → Webhooks* → **Create**.
   - URL: `https://<your-api-host>/api/v1/payments/webhook`.
   - Secret: generate a strong random string and put it in
     `RAZORPAY_WEBHOOK_SECRET`.
   - Events to enable:
     - `order.paid`
     - `payment.captured`
     - `payment.failed`
     - `refund.created`
     - `refund.processed`
     - `refund.failed`
4. **Set env vars in the deploy platform** (Vercel / Render / Fly).
5. **Smoke test** against Razorpay test mode:
   ```bash
   # 1) Create a Payment for an existing PENDING order
   curl -sS -X POST "$API/payments/create-order" \
     -H "authorization: Bearer $BUYER_TOKEN" \
     -H "content-type: application/json" \
     -d '{"orderId":"<pending-order-uuid>"}' | jq .

   # 2) Open the returned providerOrderId in the client; complete with the
   #    Razorpay test card 4111 1111 1111 1111 (any future date, any CVV).

   # 3) Verify
   curl -sS -X POST "$API/payments/verify" \
     -H "authorization: Bearer $BUYER_TOKEN" \
     -H "content-type: application/json" \
     -d '{
       "razorpay_order_id":"...",
       "razorpay_payment_id":"...",
       "razorpay_signature":"..."
     }' | jq .
   ```
6. **Verify webhook delivery** — Dashboard → Webhooks → *Test Endpoint*.
   The endpoint must return `200`. Check the `PaymentWebhookEvent` table for
   a row with `processedAt` populated.
7. **Refund smoke test** (test mode):
   ```bash
   curl -sS -X POST "$API/payments/$ORDER_ID/refund" \
     -H "authorization: Bearer $SELLER_TOKEN" \
     -H "content-type: application/json" -d '{"reason":"smoke-test"}'
   ```
8. **Switch to Live mode** only after KYC is approved. Regenerate keys under
   the Live tab and rotate the webhook secret; deploy.

## Testing

- `backend/tests/razorpay.service.test.ts` — 9 tests. Signature verification,
  SDK error mapping, `createOrder`, `createRefund`, `fetchPayment`.
- `backend/tests/payments.api.test.ts` — 11 tests. End-to-end HTTP flow
  including create-order idempotency, signature verify (valid + tampered),
  webhook dedupe, refund happy path, and access-control rejections.

Local run:

```bash
cd backend
export $(grep -v '^#' .env | xargs)
npx vitest run --pool=forks --poolOptions.forks.singleFork
```

## Frontend

- `frontend/src/lib/payments-api.ts` — API client.
- `frontend/src/components/payments/pay-with-razorpay-button.tsx` —
  loads `checkout.razorpay.com/v1/checkout.js` on demand, opens Razorpay
  Checkout, forwards the callback to `/payments/verify`.
- Wired into the buyer order detail page — a **Pay now** button appears
  whenever `order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED'`.

## Rollout / go-live checklist

Before flipping `RAZORPAY_ENABLED=true` in production:

- [ ] KYC approved.
- [ ] Test-mode smoke test passed end-to-end (create → verify → webhook →
      refund).
- [ ] Live keys generated; test keys removed from deploy secrets.
- [ ] Webhook secret rotated; only production webhook active.
- [ ] Alerting: dashboard subscription for failed webhook deliveries.
- [ ] Rate-limit budget confirmed with Razorpay support (default 60 req/s).
