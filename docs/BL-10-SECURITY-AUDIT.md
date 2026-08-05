# BL-10 · Dependency Security Audit

**Sprint:** 8  
**Branch:** `cursor/bl-10-security-audit-51d7`

---

## Overview

BL-10 closes the production-readiness gap deferred from BL-09: `npm audit` dependency hardening, schema cleanup for the legacy `OtpToken` table, and documented acceptance of remaining dev-toolchain findings.

---

## Problem statement

| Issue | Impact |
|---|---|
| 22 `npm audit` findings (11 high) on `main` | Blocks production launch checklist BL-07 |
| Playwright &lt; 1.55.1 | High — SSL verification in browser download |
| Stale `firebase-admin` / `@vercel/node` | Transitive moderate/high advisories |
| Dead `OtpToken` Prisma model (post BL-01) | Schema noise; no runtime writers |

---

## Solution

### 1. Dependency upgrades (safe, tested)

| Package | Before | After | Notes |
|---|---|---|---|
| `@playwright/test` | ^1.51.0 | ^1.62.1 | Fixes GHSA-7mvr-c777-76hp |
| `firebase-admin` | ^13.2.0 | ^13.10.0 | Latest 13.x (Node 20 compatible); v14 requires Node 22 + modular API migration |
| `@vercel/node` | ^5.1.14 | ^5.9.5 | Latest 5.x build toolchain |

### 2. Root `overrides` (transitive dev toolchain)

Applied in root `package.json` for packages that have patched releases:

- `js-yaml` ^4.2.1 — top-level hoisted to `4.3.1`; nested `@vercel/python-analysis` copy may remain at `4.1.1` (dev-only, accepted)
- `minimatch` ^10.2.3 — top-level hoisted to `10.2.6`; nested copy may remain at `10.1.1` (dev-only, accepted)
- `smol-toml` `1.6.1` — **override does not override** `@vercel/python-analysis`'s exact `1.5.2` pin without `@vercel/node` v4; accepted as dev-only risk
- `uuid` ^11.1.1 — top-level hoisted; nested `google-gax` may retain `uuid@9` (moderate, accepted until `firebase-admin` v14)

### 3. Legacy `OtpToken` removal

MSG91 replaced local OTP storage in BL-01. This sprint drops the unused model and adds migration `20260805140000_drop_otp_token`.

The `generateOtp()` helper in `helpers.ts` is **retained** — it is a generic utility with unit tests, not tied to the removed table.

### 4. CI security gate

Root script (`scripts/audit-ci.mjs`):

```bash
npm run audit:ci
```

The gate audits **production dependencies only** (`npm audit --omit=dev`) and fails on **high or critical** severities, except for advisories listed in the accepted-risk table below (currently the `react-router` RSC false positive). This matches the BL-10 intent: block **new** high-severity production-runtime issues while allowing documented exemptions.

CI runs `npm run audit:ci` after `npm ci`.

---

## Accepted residual findings (documented risk)

| Advisory | Package | Severity | Why accepted |
|---|---|---|---|
| GHSA-qwww-vcr4-c8h2 | `react-router` / `react-router-dom` 7.18.2 | High (false positive) | **Patched in 7.18.2**; only affects unstable RSC APIs (not used — app uses SPA `BrowserRouter`). npm advisory DB range not yet updated. Exempt in `scripts/audit-ci.mjs`. |
| GHSA-w5hq-g745-h8pq | `uuid` via `firebase-admin` → `google-gax` → `@google-cloud/storage` | Moderate | Nested `google-gax` pins `uuid@9` at `backend/node_modules/google-gax/node_modules/uuid`; root `overrides` do not propagate. App does not call `uuid` buffer APIs directly. Awaiting upstream `google-gax` / `firebase-admin` v14. |
| GHSA-* (nested `js-yaml`) | `@vercel/python-analysis` → `js-yaml@4.1.1` | High | **Dev/build only** — nested under `@vercel/node` toolchain. Top-level override resolves to `4.3.1`; nested copy remains until `@vercel/node` v4. |
| GHSA-* (nested `minimatch`) | `@vercel/python-analysis` → `minimatch@10.1.1` | High | **Dev/build only** — same as nested `js-yaml`. Top-level override resolves to `10.2.6`; nested copy remains until `@vercel/node` v4. |
| GHSA-* (`smol-toml`) | `@vercel/python-analysis` → `smol-toml@1.5.2` | Moderate | **Dev/build only** — exact pin in `@vercel/python-analysis`. Root + nested overrides target `^1.6.1`; if lockfile still resolves `1.5.2`, accepted until `@vercel/node` v4. |
| GHSA-* (ajv, undici, path-to-regexp) | `@vercel/node` dev toolchain | High/Moderate | **Dev/build only** — Vercel serverless runtime uses platform Node, not bundled `@vercel/node` analysers. Fixing requires `@vercel/node@4` breaking migration; tracked for future infra sprint. |

Full audit snapshot (post-BL-10):

```bash
npm audit              # ~18 total (dev + prod)
npm audit --omit=dev   # ~10 (mostly firebase-admin transitive + react-router FP)
```

---

## Verification

```bash
npm ci
npm run lint           # frontend + backend tsc
npm run test           # Vitest suites
npm run build          # production builds
npm run audit:ci       # production high-severity gate
npm run test:e2e       # Playwright (CI e2e job)
```

---

## Production configuration

No new environment variables. After deploy, operators may run:

```bash
npm audit --omit=dev
```

and compare against the accepted-risk table above.

---

## Out of scope (future sprint)

- `firebase-admin` v14 migration (Node 22 + modular import refactor)
- `@vercel/node` v4 breaking upgrade
- Redis-backed rate limiting (multi-instance)
- Full `npm audit` zero on dev-only transitive packages
