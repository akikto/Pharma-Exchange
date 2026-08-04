# Production Launch Checklist

Everything that must be verified **before** flipping DNS to production.
Each item is either "code" (already enforced by this repo) or "manual"
(operator must do it in the vendor dashboard). Code items are validated by
CI + this Sprint 3 audit. Manual items are the operator's responsibility.

---

## 1 · Repository & CI

- [x] `main` branch is protected — merge only via PR (GitHub → Settings → Branches).
- [x] CI workflow `.github/workflows/ci.yml` runs lint, backend + frontend
      Vitest, Playwright `auth` project, and the production build.
- [x] `.env.example` files exist for backend + frontend + root.
- [x] `backend/.env.production.example` + `frontend/.env.production.example`
      list every env var the deployment needs.
- [x] No secret has ever been committed. `git log -p --all | grep -E
      'BEGIN PRIVATE KEY|RAZORPAY_KEY_SECRET|MSG91_AUTH_KEY|FIREBASE_PRIVATE_KEY'`
      returns nothing.
- [ ] **Manual:** Add branch protection rules requiring PR review + CI pass
      before merge to `main`.

## 2 · Vercel — Backend

- [x] `backend/vercel.json` sets `regions: ["sin1"]`, memory 1024, security
      headers.
- [x] Serverless function bootstraps Express lazily and doesn't leak
      internal errors in production.
- [ ] **Manual:** Vercel Project → General → Root Directory = `backend/`,
      Node.js Version = `20.x`.
- [ ] **Manual:** Populate every env var from
      `backend/.env.production.example` in **Production** scope only.
- [ ] **Manual:** Bind custom domain (e.g. `api.pharmaex.bd`) and rotate
      `CORS_ORIGIN` to that domain.
- [ ] **Manual:** Enable Vercel Log Drain → Datadog / Better Stack / Axiom.
- [ ] **Manual:** Preview Deployment protection = password required.

## 3 · Vercel — Frontend

- [x] `frontend/vercel.json` sets `regions: ["sin1"]`, HSTS, Permissions-
      Policy, immutable asset cache, SW no-cache.
- [ ] **Manual:** Vercel Project → General → Root Directory = `frontend/`,
      Node.js Version = `20.x`, Install Command = `cd .. && npm ci`.
- [ ] **Manual:** Populate every env var from
      `frontend/.env.production.example`.
- [ ] **Manual:** Bind production custom domain (e.g. `app.pharmaex.bd`).
- [ ] **Manual:** Deploy the CSP header hardening (see
      [Environment Setup → CSP](ENVIRONMENT-SETUP.md#csp) — has to allow
      `checkout.razorpay.com`, Firebase auth iframes, Vercel Insights).

## 4 · PostgreSQL

- [x] Prisma schema up-to-date with migrations under
      `backend/prisma/migrations/`.
- [x] `env.ts` refuses to boot in production when `DATABASE_URL` is not a
      `postgresql://` DSN.
- [x] All hot query paths have composite indexes (Order, Listing, Payment,
      Refund, PaymentWebhookEvent).
- [ ] **Manual:** Point `DATABASE_URL` at a **pooled** connection endpoint
      when running on Vercel serverless (Neon "pooler", Supabase
      "pgbouncer", or RDS Proxy). Append
      `?sslmode=require&pgbouncer=true&connection_limit=1` to the URL.
- [ ] **Manual:** Run `npx prisma migrate deploy` against production before
      first release. The prod DB should have zero drift vs. `migrations/`.
- [ ] **Manual:** Enable point-in-time recovery on the DB provider.
- [ ] **Manual:** Rotate DB password quarterly.

## 5 · Firebase

- [x] Admin SDK reads service account from env only — no JSON key in repo.
- [x] `verifyFirebaseToken` uses `checkRevoked=true` in production.
- [x] `firebase/firestore.rules` + `firebase/storage.rules` deny-by-default.
- [ ] **Manual:** Firebase Console → Authentication → Settings → Authorized
      domains includes the production frontend origin(s) and excludes
      `localhost`.
- [ ] **Manual:** Firebase Console → IAM → service account has only
      *Firebase Admin SDK Administrator Service Agent* + *Cloud Messaging
      Admin*.
- [ ] **Manual:** `firebase deploy --only firestore:rules,storage`.
- [ ] **Manual:** Rotate service account key every 90 days.

## 6 · Payments (Razorpay · BL-02)

- [x] `RAZORPAY_ENABLED=true` requires KEY_ID + KEY_SECRET + WEBHOOK_SECRET
      at boot.
- [x] Webhook endpoint uses `express.raw()` — HMAC verifies exact bytes.
- [ ] **Manual:** Live-mode keys generated after KYC approval; test-mode
      keys removed.
- [ ] **Manual:** Webhook URL registered with the six required events.
- [ ] **Manual:** WEBHOOK_SECRET rotated once before go-live.

## 7 · SMS OTP (MSG91 · BL-01)

- [x] `MSG91_ENABLED=true` requires AUTH_KEY + SENDER_ID + TEMPLATE_ID.
- [x] No dev-mode OTP fallback anywhere.
- [ ] **Manual:** MSG91 Auth Key issued for production and stored in the
      Vercel env manager.
- [ ] **Manual:** Sender ID + OTP template approved for Bangladesh.

## 8 · Security

- [x] JWT_SECRET must be ≥ 32 chars in production (enforced at boot).
- [x] `helmet` + HSTS in production.
- [x] Rate limiters: global (500/15m), auth (60/15m per identity), otp
      (5/min).
- [x] Error handler hides internal error messages in production; returns
      `{error, code}` only.
- [x] `express.raw()` payment webhook + timing-safe HMAC verification.
- [ ] **Manual:** Rotate all secrets quarterly (JWT, Razorpay, MSG91,
      Firebase service account, DB password).
- [ ] **Manual:** Enable Vercel WAF (paid tier) once daily traffic > 1k
      requests.

## 9 · Observability

- [ ] **Manual:** Log Drain configured for both Vercel projects.
- [ ] **Manual:** Alert on `5xx > 1%` and `Bootstrap failed` counter > 0.
- [ ] **Manual:** Uptime probe hitting `GET /health` (backend) and `GET /`
      (frontend) every 60 s.

## 10 · Compliance (BL-04 / BL-05 · Sprint 4)

- [ ] Privacy Policy page live.
- [ ] Terms & Conditions page live.
- [ ] Links visible from Settings, Login/Register, About screens.
- [ ] Play Store data-safety form matches actual data collection.
