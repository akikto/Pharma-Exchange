# Security Report — PharmEx

**Date:** August 2, 2026

## Authentication

| Control | Implementation | Status |
|---------|----------------|--------|
| JWT access tokens | jsonwebtoken, configurable expiry | OK |
| Refresh tokens | Separate endpoint, rate-limited | OK |
| Password hashing | bcryptjs | OK |
| OTP | crypto.randomInt, dev mode blocked in production | OK |
| Firebase Auth | Server-side admin SDK verification | OK |

## Authorization Fixes (Task 6)

| Resource | Control | Status |
|----------|---------|--------|
| Orders | Buyer/seller/admin only on getById | Fixed |
| Buy requests | Buyer/seller/admin only on getById | Fixed |
| Medicine catalog | Admin-only create/update | Fixed |
| Listings | Verified pharmacy required | Fixed |
| Chat rooms | Membership verified before socket join | Fixed |
| FCM tokens | Cannot hijack another user's token | Fixed |

## Input Validation & Uploads

- Zod schemas on request bodies
- JSON body limit: 2 MB
- Firebase Storage private objects with signed URLs
- Removed user-controlled upload folder parameter

## Headers & CORS

- Helmet security headers
- CORS restricted via `CORS_ORIGIN` env
- Swagger disabled in production
- `trust proxy` enabled

## Rate Limiting

- express-rate-limit on API and auth endpoints
- Gap: in-memory store — use Redis for multi-instance deployments

## Recommendations

1. Rotate JWT_SECRET on compromise (32+ random bytes)
2. Use platform secret managers (Vercel Env, GCP Secret Manager)
3. Enable SSL on DATABASE_URL (`?sslmode=require`)
4. Run `npm audit fix` before production
