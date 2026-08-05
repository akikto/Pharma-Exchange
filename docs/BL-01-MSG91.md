# BL-01 · MSG91 SMS OTP Integration

**Status:** Complete
**Sprint:** 1 · Launch Blockers
**Owner:** Platform / Auth
**Related endpoints:** `POST /auth/register`, `POST /auth/send-otp`, `POST /auth/resend-otp`, `POST /auth/verify-otp`

---

## What changed

Pharma-Exchange previously generated OTPs locally, stored them in the
`OtpToken` table and — in "development mode" — echoed the plaintext code back
in API responses and log lines. That behaviour has been removed entirely.

**Now:**

1. All SMS OTPs are sent and verified by **MSG91** (production carrier).
2. The backend no longer generates, stores or logs plaintext OTPs.
3. There is no `OTP_DEV_MODE` fallback and no `devOtp` field on any HTTP
   response. If MSG91 is not configured, phone-based auth fails fast.
4. Phone-based `POST /auth/register` returns
   `{ requiresOtpVerification: true, otpRequestId }` and does **not** issue
   tokens until the user completes `POST /auth/verify-otp`.
5. Rate limiting on `/auth/send-otp` and `/auth/resend-otp` is unchanged (per
   phone/IP, 5 requests / 60 s via `otpRateLimiter`).

Email-based registration continues to issue tokens immediately (email
verification is a separate, out-of-scope flow).

## Endpoints

| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/auth/register` (phone) | POST | `{ firstName, lastName, phone, password }` | `201 { user, requiresOtpVerification: true, otpRequestId }` |
| `/auth/register` (email) | POST | `{ firstName, lastName, email, password }` | `201 { accessToken, refreshToken, user }` |
| `/auth/send-otp` | POST | `{ phone, purpose: 'login' \| 'password_reset' }` | `200 { message, requestId }` |
| `/auth/resend-otp` | POST | `{ phone }` | `200 { message, requestId }` |
| `/auth/verify-otp` | POST | `{ phone, code, purpose }` | `200 { accessToken, refreshToken, user }` |

**Error codes**

| Code | HTTP | Meaning |
|---|---|---|
| `OTP_PROVIDER_UNAVAILABLE` | 503 | MSG91 network / 5xx failure |
| `OTP_PROVIDER_RATE_LIMIT` | 429 | MSG91 returned 429 |
| `OTP_PROVIDER_AUTH` | 401 | MSG91 auth-key rejected (misconfig) |
| `OTP_PROVIDER_ERROR` | 502 | MSG91 4xx (bad template, invalid mobile, etc.) |

## Configuration

All configuration is environment-driven — see `backend/.env.example`.

| Variable | Required in prod | Description |
|---|---|---|
| `MSG91_ENABLED` | yes | Must be `true` in production. If `true`, `AUTH_KEY`/`SENDER_ID`/`TEMPLATE_ID` must all be set (validated at boot). |
| `MSG91_AUTH_KEY` | yes | Control Panel → *API / Integration* → **Auth Key**. Rotate quarterly. |
| `MSG91_SENDER_ID` | yes | Approved sender ID for Bangladesh. |
| `MSG91_TEMPLATE_ID` | yes | Approved OTP template containing `##OTP##`. |
| `MSG91_OTP_LENGTH` | no (6) | 4–9 digits. Matches template placeholder length. |
| `OTP_EXPIRY_MINUTES` | no (10) | Passed to MSG91. 1–10080. |
| `MSG91_BASE_URL` | no | Override only for staging/testing. Default `https://control.msg91.com/api/v5/otp`. |

If `MSG91_ENABLED=true` and any required var is missing, the process **exits
during startup** — this is intentional so that misconfigured production
deployments cannot silently accept phone auth requests.

## Production setup checklist

Do this **before** deploying phone-based auth.

1. **Create an MSG91 account.**
   - Sign up at <https://control.msg91.com>.
   - Complete company KYC. Bangladesh MSG91 accounts require billing details
     and a valid business address.
2. **Get an Auth Key.**
   - Control Panel → *API / Integration* → **Auth Key** → copy.
   - Store as `MSG91_AUTH_KEY` in the deployment secrets manager. Never commit.
3. **Register a Sender ID.**
   - Control Panel → *Sender ID Management* → Add for country **Bangladesh**.
   - Wait for approval (typically 1–3 business days). Copy the approved
     sender ID into `MSG91_SENDER_ID`.
4. **Create an OTP template.**
   - Control Panel → *Templates* → **Create**.
   - Category: `Transactional`. Include the placeholder `##OTP##`.
     Example body: `Your Pharma-Exchange verification code is ##OTP##. Valid
     for 10 minutes. Do not share this code.`
   - Wait for approval, copy the Template ID into `MSG91_TEMPLATE_ID`.
5. **Set the environment variables** in Vercel / Render / Fly (or wherever
   the backend runs). Set `MSG91_ENABLED=true`. Keep `.env.example` up to
   date so future onboarding is trivial.
6. **Smoke test.**
   ```bash
   # 1) Register a phone user (should return requiresOtpVerification: true)
   curl -sS -X POST "$API/auth/register" -H 'content-type: application/json' \
     -d '{"firstName":"QA","lastName":"Bot","phone":"+8801XXXXXXXXX","password":"password123"}'

   # 2) Complete verification with the SMS you received
   curl -sS -X POST "$API/auth/verify-otp" -H 'content-type: application/json' \
     -d '{"phone":"+8801XXXXXXXXX","code":"123456","purpose":"registration"}'
   ```
7. **Verify no plaintext OTP appears in logs.** MSG91 traffic is logged only
   as `msg91 non-ok status=... type=...` — no mobile numbers or codes.
8. **Rotate the Auth Key quarterly** and after any suspected leak.

## Security notes

- The `authkey` is always sent as an HTTP header, never as a query
  parameter. Query strings can leak into upstream access logs.
- The service logs neither the mobile number nor the OTP code (only response
  status and MSG91 `type`).
- OTP length and expiry are enforced server-side; the backend cannot be
  tricked into accepting shorter or older codes than MSG91 issued.
- Requests time out after 10 seconds to prevent the API from hanging when
  MSG91 is degraded.
- Bangladesh phone numbers are normalised to `880` prefix; malformed numbers
  are rejected before contacting MSG91.

## Testing

Two dedicated test suites cover BL-01:

- `backend/tests/msg91.service.test.ts` — unit tests with `fetch` mocked.
  Covers success, 429, 401/403, 5xx, network failure, resend and verify.
- `backend/tests/auth.register.test.ts` — integration tests that assert
  phone registration triggers MSG91 and does **not** issue tokens, and that
  email registration still returns tokens with no `devOtp` field.
- `backend/tests/auth.verify-otp.test.ts` — integration test for the verify
  flow, including validation errors.

Run them locally:

```bash
export $(grep -v '^#' backend/.env | xargs)
npx vitest run --pool=forks --poolOptions.forks.singleFork
```

## Migration notes

- The legacy `OtpToken` Prisma model and database table were **removed in BL-10**
  (migration `20260805140000_drop_otp_token`). OTP delivery is handled entirely
  by MSG91; no local OTP rows are stored.
- The `generateOtp()` helper in `shared/utils/helpers.ts` is retained as a
  generic utility (unit-tested); it is not tied to database OTP storage.
- Any client still POSTing `email` to `/auth/send-otp` now gets a
  `VALIDATION_ERROR`. Password reset via email uses `/auth/reset-password`
  and does not require an OTP in the current implementation.
