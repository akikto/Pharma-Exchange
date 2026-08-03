# Authentication Compatibility

Email OTP is **additive** — it does not replace email + password login.

## Primary login (unchanged)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/v1/auth/login` | Email or phone + **password** | Main sign-in flow |
| `POST /api/v1/auth/register` | Email/phone + password | Account creation |
| `POST /api/v1/auth/refresh` | Refresh token | Session renewal |

The frontend login page (`/login`) uses `POST /auth/login` exactly as before.

## Email OTP scope (password reset only)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/auth/forgot-password` | Send OTP to email |
| `POST /api/v1/auth/verify-email-otp` | Verify OTP, get reset token |
| `POST /api/v1/auth/reset-password` | Set new password (requires reset token) |

After reset, users **sign in again** with email + new password on `/login`.

`POST /auth/reset-password` does **not** return login tokens — it only confirms the password change.

## Separate legacy OTP (phone login)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/auth/send-otp` | Phone/login OTP only (`purpose: login`) |
| `POST /api/v1/auth/verify-otp` | Verify phone/login OTP |

`purpose: password_reset` is **rejected** on these endpoints — use the forgot-password flow instead.

## Optional email verification (future)

Not enabled today. Registration auto-signs-in in production (no email OTP gate).
A future `purpose: email_verification` could use the same `EmailOtp` table without affecting login.

## Data stores

| Table | Used for |
|-------|----------|
| `User.passwordHash` | Email + password login (unchanged) |
| `EmailOtp` | Password reset OTP only (hashed, Resend) |
| `OtpToken` | Legacy phone/login/registration OTP |
