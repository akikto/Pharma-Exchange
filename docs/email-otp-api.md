# Email OTP Authentication API

Secure email OTP flow for password reset on Pharma-Exchange.

**Base URL:** `/api/v1/auth` (also available at legacy `/api/auth`)

---

## Flow Overview

```
1. POST /forgot-password     → Send OTP to email
2. POST /verify-email-otp    → Verify OTP, receive resetToken (15 min)
3. POST /reset-password      → Set new password with resetToken
```

---

## Endpoints

### 1. Request Password Reset OTP

**`POST /forgot-password`**

Sends a 6-digit OTP to the registered email. Does not reveal whether the email exists.

**Rate limit:** 5 requests/minute per email (plus 60s resend cooldown, max 5 per 15 min)

**Request body:**
```json
{
  "email": "user@example.com"
}
```

**Response `200`:**
```json
{
  "message": "If an account exists with this email, a verification code has been sent."
}
```

**Notes:**
- OTP expires after **5 minutes**
- OTP is stored **hashed** (bcrypt) — never returned in API response
- In development (`OTP_DEV_MODE=true`), `devOtp` is included for testing only

---

### 2. Verify Email OTP

**`POST /verify-email-otp`**

Verifies the 6-digit code. On success, returns a short-lived JWT reset token.

**Rate limit:** 20 attempts per 15 minutes per email

**Request body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response `200`:**
```json
{
  "message": "Verification successful",
  "resetToken": "<jwt>",
  "expiresIn": 900
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | Invalid or expired code |
| `429` | Max verification attempts exceeded (5 per OTP) |

**Security:**
- OTP record is **deleted** after successful verification (one-time use)
- Failed attempts increment `attempts` counter; OTP locked after 5 failures

---

### 3. Reset Password

**`POST /reset-password`**

Sets a new password using the reset token from step 2.

**Request body:**
```json
{
  "resetToken": "<jwt from verify-email-otp>",
  "newPassword": "SecurePass1"
}
```

**Password rules:**
- Minimum 8 characters
- At least one letter
- At least one number

**Response `200`:**
```json
{
  "message": "Password updated successfully",
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "...", "email": "...", ... }
}
```

**Side effects:**
- All refresh tokens for the user are invalidated
- All email OTP records for the user are deleted

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | Validation failed (weak password) |
| `401` | Invalid or expired reset token |

---

## Database: `EmailOtp` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | String | Normalized lowercase email |
| `hashedOtp` | String | bcrypt hash of 6-digit OTP |
| `expiresAt` | DateTime | Expiration (5 min from creation) |
| `attempts` | Int | Failed verification count (max 5) |
| `verified` | Boolean | Always false until deleted on verify |
| `createdAt` | DateTime | Creation timestamp |

**Cleanup:** Expired records are deleted every 30 minutes by background job (local server) or on next OTP request.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_OTP_EXPIRY_MINUTES` | `5` | OTP validity |
| `EMAIL_OTP_MAX_ATTEMPTS` | `5` | Max verify attempts per OTP |
| `EMAIL_OTP_RESEND_COOLDOWN_SECONDS` | `60` | Min seconds between resends |
| `PASSWORD_RESET_TOKEN_EXPIRES_IN` | `15m` | JWT reset token TTL |
| `RESEND_API_KEY` | — | Resend API key (`re_...`) |
| `RESEND_FROM` | `Pharma-Exchange <onboarding@resend.dev>` | Verified sender address |
| `OTP_DEV_MODE` | `false` | Dev-only OTP logging (must be false in prod) |

---

## Authentication Events Logged

Structured `auth_event` logs via Winston:

- `password_reset_otp_sent`
- `password_reset_otp_requested_unknown`
- `password_reset_otp_verify_failed`
- `password_reset_otp_invalid`
- `password_reset_otp_locked`
- `password_reset_otp_verified`
- `password_reset_token_invalid`
- `password_reset_completed`
- `password_reset_otp_rate_limited`

Emails are masked in logs (e.g. `j***n@example.com`).

---

## Frontend Routes

| Route | Step |
|-------|------|
| `/forgot-password` | Email → OTP → New password (multi-step) |
| `/verify-email-otp` | Alias to forgot-password flow (OTP step) |
