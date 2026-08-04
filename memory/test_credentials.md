# Test Credentials

Seeded via `npm run db:seed --workspace=backend` (`prisma/seed.ts`).

## Web (email + password)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@pharmex.bd` | `password123` |
| Seller | `seller@pharmex.bd` | `password123` |
| Buyer | `buyer@pharmex.bd` | `password123` |

## MSG91 (phone OTP) — dev/test

Tests mock `global.fetch` — no real credentials required. Test env sets:

- `MSG91_ENABLED=true`
- `MSG91_AUTH_KEY=test-msg91-auth-key`
- `MSG91_SENDER_ID=MEDLNK`
- `MSG91_TEMPLATE_ID=test-msg91-template-id`
- `MSG91_OTP_LENGTH=6`

For live phone OTP smoke tests against staging, use the real MSG91 keys
provisioned by the platform team (out of scope for this workspace).

## Local Postgres

`postgresql://medlink:medlink@localhost:5432/medlink_b2b?schema=public`
(superuser role, created by the local dev bootstrap).
