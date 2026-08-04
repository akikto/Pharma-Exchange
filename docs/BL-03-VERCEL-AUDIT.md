# BL-03 · Vercel Production Audit

**Sprint:** 3
**Scope:** Backend + Frontend Vercel deployment configuration.
**Status:** ✅ Audited; safe fixes applied.

---

## Executive summary

Pharma-Exchange deploys as **two separate Vercel projects**:

- **Backend** (`pharma-exchange-backend`) — Node.js serverless function at
  `api/index.ts` that wraps the Express app.
- **Frontend** (`pharma-exchange-frontend`) — Vite static SPA served from
  Vercel's edge CDN.

Both were reviewed. All infrastructure-safe fixes are shipped in this PR;
items requiring an operator action (rotating secrets, adding a Vercel
region, verifying Postgres pooling) are called out below.

---

## Backend project (`backend/vercel.json`)

### Configuration audit

| Setting | Previous | Now | Rationale |
|---|---|---|---|
| Install command | `cd .. && npm ci --include=dev` | unchanged | Workspace-aware install, required for Prisma. |
| Build command | `npm run vercel-build` | unchanged | Runs `prisma generate && tsc`. |
| `regions` | not set (default `iad1`) | **`["sin1"]`** | Bangladesh buyer latency: Singapore reduces RTT ~180 ms vs. Virginia. |
| `functions.api/index.ts.maxDuration` | 30 s | unchanged | Sufficient for Prisma cold start + longest reasonable request. |
| `functions.api/index.ts.memory` | not set (default 1024 MB) | **explicit 1024** | Documented so drift is visible. |
| `includeFiles` | `../node_modules/.prisma/**` | unchanged | Ships the query engine binary. |
| `redirects` `/` → `/api` | present | unchanged | Provides a friendly root. |
| `rewrites` `/(.*)` → `/api` | present | unchanged | Single-function routing — Express handles versioning inside. |
| Security headers | none at edge | **added** | See below. |

### Security headers (backend, edge)

Added at the Vercel edge layer as belt-and-braces alongside `helmet` in
Express:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `no-referrer` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self), payment=(self)` |

CSP is intentionally **not set on the backend** — it responds JSON only,
and a mis-configured CSP on a JSON endpoint yields no benefit while risking
breakage. The Express `helmet` middleware still enables its default CSP in
production for any HTML responses (Swagger UI is disabled in prod).

### CORS

Managed inside Express (`backend/src/config/cors.ts`), not at the edge —
Vercel's edge CORS features don't compose well with the dynamic origin
callback we need for Vercel preview deployments. `credentials: false` on
purpose: this API uses JWT bearer tokens, never cookies.

### Compression

Vercel automatically gzip/brotli-compresses responses. No app-level
`compression` middleware is added — that would double-compress on the edge.

### Cache policy

- Backend function: no `Cache-Control` header is set. All API responses are
  effectively `no-store` (Vercel's default for @vercel/node dynamic
  functions). Verified with a dry run of `/api/v1/health`.
- Frontend `/assets/*` (Vite content-hashed): `public, max-age=31536000, immutable`.
- `/sw.js`, `/manifest.webmanifest`, `/firebase-messaging-sw.js`:
  `no-cache, no-store, must-revalidate` (required so PWA updates propagate).

### Health endpoint

- `GET /` and `GET /api` respond immediately from `api/index.ts` **without**
  bootstrapping Express or Prisma. This avoids a cold-start on every
  liveness probe.
- `GET /health` and `GET /api/v1/health` route through Express for a
  DB-aware readiness probe.
- Diagnostics payload was trimmed — no longer echoes `nodeEnv` twice, no
  provider-specific booleans that could leak configuration deltas between
  environments. Only booleans indicating whether required secrets are
  present.

### Production logging

- `morgan('combined')` in production → Vercel captures stdout automatically.
- 5xx / bootstrap errors log via `console.error`. In production, the HTTP
  response never leaks the internal error message any more (see
  `api/index.ts` bootstrap handler change).

---

## Frontend project (`frontend/vercel.json`)

### Configuration audit

| Setting | Previous | Now |
|---|---|---|
| Framework | `vite` | unchanged |
| `outputDirectory` | `dist` | unchanged |
| `buildCommand` | `npm run build` | unchanged |
| `regions` | not set | **`["sin1"]`** — matches backend |
| SPA rewrite `/(.*)` → `/index.html` | present | unchanged |
| Security headers | partial | expanded |
| `firebase-messaging-sw.js` cache | not overridden | **`no-cache, no-store, must-revalidate`** |
| `/assets/*` cache | `public, immutable, 1y` | unchanged |

### Security headers (frontend, edge)

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Permissions-Policy` | `camera=(self), microphone=(self), geolocation=(self), payment=(self)` |

CSP was **not** hardened in this pass — the app relies on the Razorpay
hosted checkout script (`checkout.razorpay.com`), Firebase Auth iframes and
Vercel-served assets. Defining a strict CSP here would break Razorpay. It
is documented as **manual work** in the Production Checklist.

---

## API routing

Verified end-to-end:

| Path | Handled by |
|---|---|
| `GET /` | serverless liveness (fast) |
| `GET /health` | serverless liveness (fast) |
| `GET /api/v1/health` | Express `healthRoutes` (DB-aware) |
| `POST /api/v1/payments/webhook` | Express with `express.raw()` (HMAC) |
| everything else | Express router |

The webhook mount is confirmed above the JSON parser so HMAC signatures
verify against the exact bytes Razorpay signed (regression tested in
`tests/payments.api.test.ts`).

---

## Manual actions required (operator)

Anything the code cannot enforce is listed here so the launch checklist
stays honest.

1. **Vercel Project Settings → General**
   - Set `Root Directory` to `backend/` and `frontend/` on the respective
     Vercel projects.
   - Set `Node.js Version` to **20.x** on both projects (matches
     `engines.node` in `package.json`).
2. **Vercel Project Settings → Environment Variables**
   - Populate all keys from `backend/.env.production.example` and
     `frontend/.env.production.example` **for the Production environment
     only**. Do not tick "Preview" or "Development" for production secrets.
3. **Vercel Project Settings → Deployment Protection**
   - Enable password protection on Preview deployments so unauthenticated
     scrapers cannot hit the API keys embedded in the preview build.
4. **Vercel Project Settings → Git**
   - `Production Branch` → `main`. `Auto Deploy` on `main` only after CI is
     green (see `.github/workflows/ci.yml`).
5. **Vercel Domains**
   - Bind the production custom domain (e.g. `api.pharmaex.bd`,
     `app.pharmaex.bd`) and rotate `CORS_ORIGIN` to reflect it.
6. **Log Drains / Observability**
   - Wire Vercel Log Drains to Datadog / Better Stack / Axiom. The default
     Vercel dashboard rolls off after 24 h, which is not sufficient for a
     regulated (pharmacy) marketplace.

---

## Fixes shipped in this PR

- `backend/vercel.json` — added `regions`, explicit memory, edge security
  headers.
- `frontend/vercel.json` — added HSTS + Permissions-Policy + SW cache
  override.
- `backend/api/index.ts` — diagnostics trimmed, error responses no longer
  leak env in production.
- `backend/src/config/env.ts` — production boot enforces
  `JWT_SECRET.length ≥ 32` and `DATABASE_URL` uses `postgresql://` scheme.
- `backend/.env.production.example`, `frontend/.env.production.example` —
  operator-ready templates.

## Not changed (documented in Production Checklist)

- CSP hardening on the frontend (needs manual Razorpay / Firebase allowlist).
- Vercel Analytics / Speed Insights enablement (dashboard-only setting).
- Log Drain configuration (dashboard-only).
