# Security Audit — Pharma-Exchange v1.0.1-rc1

**Date:** 2026-08-04  
**Scope:** Launch-blocker security review (no API/UI changes)  
**Environment audited:** Local dev + static code review

---

## Summary

| Category | Rating | Notes |
|----------|--------|-------|
| Authentication | ⚠️ Partial | JWT solid; OTP delivery not production-ready |
| Authorization | ✅ Good | Role guards on admin/seller routes |
| Transport | ⬜ Unverified | Requires HTTPS production deploy |
| Secrets management | ✅ Good | `.env` gitignored; examples use placeholders |
| Dependency security | ⚠️ Action needed | 22 npm audit findings |
| Rate limiting | ✅ Implemented | In-memory; single-instance only |

**Overall security posture:** Acceptable for **closed beta**; **not** acceptable for public launch until OTP, secrets rotation, and dependency fixes are complete.

---

## 1. MSG91_ENABLED

| Check | Result |
|-------|--------|
| Default in schema | `false` (`backend/src/config/env.ts`) |
| Production guard | Throws if `NODE_ENV=production` && `MSG91_ENABLED=true` |
| Current dev `.env` | `MSG91_ENABLED` not set in committed files |
| **Production requirement** | Set `MSG91_ENABLED=true` + MSG91 secrets explicitly on Vercel |

**Finding SEC-01 (Blocker):** No SMS/email OTP provider integrated. `sendOtp()` only logs OTP in dev; registration auto-signs-in when `MSG91_ENABLED=true` + MSG91 secrets without verification.

---

## 2. JWT Security

| Control | Implementation | Status |
|---------|----------------|--------|
| Secret validation | Min 16 chars via Zod | ✅ |
| Access token expiry | `JWT_EXPIRES_IN` default `7d` | ✅ |
| Refresh token expiry | `JWT_REFRESH_EXPIRES_IN` default `30d` | ✅ |
| Refresh rotation | Old tokens deleted on login/refresh | ✅ |
| bcrypt password hashing | Cost factor 12 | ✅ |
| Bearer auth middleware | `auth.middleware.ts` | ✅ |

**Recommendations:**
- [ ] Use 32+ character cryptographically random `JWT_SECRET` in production
- [ ] Consider shorter access token TTL (e.g. 15m) with refresh for high-security deployment
- [ ] Document token revocation procedure for compromised accounts

---

## 3. CORS

**File:** `backend/src/config/cors.ts`

| Behavior | Status |
|----------|--------|
| Explicit `CORS_ORIGIN` comma-list support | ✅ |
| PharmEx Vercel origin allowlist | ✅ |
| Preview deployment regex | ✅ |
| Warning when `CORS_ORIGIN=*` in production | ✅ |

**Finding SEC-02:** Production must set `CORS_ORIGIN=https://<your-frontend-domain>` — wildcard is warned but not blocked.

---

## 4. Rate Limiting

**File:** `backend/src/shared/middleware/rateLimit.middleware.ts`

| Limiter | Window | Max (dev / prod) |
|---------|--------|------------------|
| Global | 15 min | 100 / 500 |
| Auth | 15 min | 100 / 60 per identity |
| OTP | 1 min | 5 |

**Finding SEC-03 (Non-blocker):** In-memory store does not sync across serverless instances or horizontal scale. Use Redis for multi-node production.

**Finding SEC-04 (QA):** Intensive E2E/login testing triggers auth rate limits. Run backend with `RATE_LIMIT_MAX=10000` during Playwright suites.

---

## 5. Firebase Configuration

| Component | Status |
|-----------|--------|
| Backend Admin SDK | Optional via `FIREBASE_*` env |
| Frontend web config | `VITE_FIREBASE_*` |
| FCM token registration | `/auth/fcm-token` endpoint |
| Service worker | `firebase-messaging-sw.js` generated on build |
| `isFirebaseConfigured()` guard | ✅ |

**Finding SEC-05 (Blocker for push):** Production Firebase project, service account, and VAPID key must be configured and verified on HTTPS before enabling push in production.

---

## 6. Exposed Secrets Scan

| Pattern scanned | Result |
|-----------------|--------|
| Private keys in repo | ❌ None committed |
| API keys in source | ❌ None hardcoded |
| `backend/.env` | Gitignored (local dev JWT present) |
| Seed passwords in `prisma/seed.ts` | ⚠️ Demo only — must not ship to production DB |

**Action:** Rotate any credentials that were ever committed; use Vercel encrypted env vars.

---

## 7. npm audit (2026-08-04)

```
Total: 22 vulnerabilities (11 high, 11 moderate, 0 critical)
```

| Package | Severity | Risk | Action |
|---------|----------|------|--------|
| `@vercel/node` → `undici`, `path-to-regexp` | High | DoS / ReDoS in serverless toolchain | Upgrade `@vercel/node` when available |
| `react-router` / `react-router-dom` | High | CSRF in RSC mode (not used) | Upgrade to ≥8.3.0 |
| `playwright` | High | Dev-only browser download | Upgrade to ≥1.55.1 |
| `firebase-admin` → `google-gax` | Moderate | Transitive | Monitor upstream |
| `js-yaml`, `minimatch` | High | Dev/build toolchain | `npm audit fix` |

```bash
npm audit
npm audit fix
# Review remaining; avoid --force without testing
```

---

## 8. HTTP Security Headers

**Frontend (`frontend/vercel.json`):**

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

**Missing (recommended):**
- [ ] `Content-Security-Policy` (tune for Firebase, Vite assets)
- [ ] `Strict-Transport-Security` (HTTPS only)
- [ ] `Permissions-Policy`

---

## 9. Security Checklist (pre-launch)

- [ ] `MSG91_ENABLED=true` + MSG91 secrets on production backend
- [ ] Strong unique `JWT_SECRET` (32+ chars)
- [ ] Explicit `CORS_ORIGIN` (no wildcard)
- [ ] HTTPS enforced on frontend + API
- [ ] Firebase service account key in Vercel secrets only
- [ ] `npm audit` high findings resolved or accepted with documented risk
- [ ] Demo/seed accounts disabled or password-rotated in production
- [ ] Privacy policy documents data retention and deletion
- [ ] Rate limiting backed by Redis if scaling beyond single instance

---

## Blocking Security Issues

| ID | Issue | Severity |
|----|-------|----------|
| SEC-01 | No production OTP delivery | **Critical** |
| SEC-02 | CORS wildcard possible in prod | **High** |
| SEC-05 | Firebase not verified in prod | **High** |
| SEC-07 | npm audit high vulnerabilities | **Medium-High** |
