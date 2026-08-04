# UI Polish Report

**Date:** 2026-08-04  
**Branch:** `cursor/ui-polish-seller-239a`  
**Source of truth:** UI Verification Audit (verified issues only)

---

## Summary

This pass addresses verified seller UX gaps, navigation confusion, missing dedicated seller pages, inventory inline actions, watchlist discoverability, and confirmed runtime/navigation bugs — without adding new product features.

---

## Before vs After

### 1. Seller Mode

| Before | After |
|--------|-------|
| Approved sellers logged in as buyer mode by default | Approved sellers auto-switch to seller mode on login |
| Post-login redirect always went to `/` | Redirect follows mode: seller → `/seller`, buyer → `/` |
| Mode persisted but never applied on login | Mode persists across sessions; manual profile toggle is remembered via `modeUserSet` |

**Files:** `auth-store.ts`, `auth-utils.ts`, `login-page.tsx`, `splash-page.tsx`, `profile-page.tsx`

### 2. Seller Navigation

| Before | After |
|--------|-------|
| Seller bottom nav included **Cart** (buyer hub) | Seller nav: **Dashboard → Orders → Inventory → Chat → Profile** |
| Pending-requests badge on Inventory tab (confusing) | Badge moved to **Orders** tab |
| Analytics only via dashboard grid | Analytics shortcut on seller Orders top bar + dashboard quick actions |
| Dashboard lacked dedicated Requests shortcut | Added **Buy Requests** quick action on dashboard |

**Files:** `nav-config.ts`, `seller-dashboard-page.tsx`, `seller-orders-page.tsx`, `bottom-nav.tsx`, `side-nav.tsx`

### 3. Orders & Requests

| Before | After |
|--------|-------|
| `/seller/orders` redirected to `/cart?tab=orders` | Dedicated **Seller Orders** page with `OrdersTabPanel` |
| `/seller/requests` redirected to `/cart?tab=requests` | Dedicated **Seller Requests** page with `BuyRequestsTabPanel` |
| Seller order detail used buyer path only | Added `/seller/orders/:id` route (stays in seller area) |

**Files:** `seller-orders-page.tsx`, `seller-requests-page.tsx`, `router.tsx`, `orders-tab-panel.tsx`

### 4. Inventory Inline UX

| Before | After |
|--------|-------|
| Price/discount/stock changes required full edit form | Inline **Price**, **Discount %**, and **Stock** fields with save on each row |
| Backend `PATCH /listings/:id/price` and `/quantity` unused in UI | New `useUpdateListingPrice` / `useUpdateListingQuantity` hooks wired to inventory rows |
| Full edit form (modal/page) unchanged | Unchanged — inline actions complement existing flow |

**Files:** `seller-inventory-page.tsx`, `use-api.ts`

### 5. Watchlist Discoverability

| Before | After |
|--------|-------|
| Watchlist only via home header heart icon | **Watchlist** added to buyer bottom/side nav (with count badge) |
| Home header heart shortcut | Preserved |

**Files:** `nav-config.ts`, `use-nav-badges.ts`, i18n

### 6. Verified Bug Fixes

| Bug | Fix |
|-----|-----|
| `Cannot read properties of undefined (reading 'id')` | Prior fixes retained (`use-nav-badges.ts` sender guard, listing validation guards) |
| Watchlist detail linked to `/medicine/:medicineId` (listing id expected) | Links now go to `/medicine/:medicineId/compare` |
| Seller routes kicked users to buyer cart hub | Dedicated seller pages keep users in `/seller/*` |

---

## Screenshots

> E2E screenshots require a running PostgreSQL instance with seed data. Docker/PostgreSQL were unavailable in the cloud agent environment during this run. Structural and unit-test verification completed below.

| Area | Status |
|------|--------|
| Seller nav layout | Verified via `nav-config.test.ts` |
| Buyer watchlist nav | Verified via `nav-config.test.ts` |
| Auth redirect helpers | Verified via `auth-utils.test.ts` |
| Production build | Verified — all chunks compile |

---

## Test Results

| Check | Result | Notes |
|-------|--------|-------|
| Frontend lint (`tsc --noEmit`) | **PASS** | |
| Frontend tests (`vitest run`) | **PASS** | 80/80 tests |
| Backend lint (`tsc --noEmit`) | **PASS** | |
| Backend tests (`vitest run`) | **FAIL** | 17 failures — PostgreSQL not available (503 on API); environment limitation, not introduced by this PR |
| Frontend build (`vite build`) | **PASS** | PWA + chunks generated |
| Seller flow E2E | **Blocked** | No database in agent VM |
| Buyer flow E2E | **Blocked** | No database in agent VM |

### New / updated tests

- `frontend/tests/auth-utils.test.ts` — seller detection + home route
- `frontend/tests/nav-config.test.ts` — updated buyer/seller nav expectations

---

## Bugs Fixed

1. Approved sellers no longer land on buyer home after login
2. Seller `/orders` and `/requests` no longer redirect to buyer cart hub
3. Watchlist medicine links no longer 404 on medicine detail (now open comparison)
4. Seller navigation no longer exposes buyer cart tab
5. Inventory rows support quick price/discount/stock updates

---

## Remaining Limitations

- **Payments, OTP, uploads, reviews** — intentionally out of scope
- **Full edit form** still required for batch, expiry, MOQ, and other listing fields
- **Seller order detail** reuses `OrderDetailPage` component (shared UI, seller-scoped route)
- **Search** removed from buyer bottom nav to fit watchlist; still available from home and `/search`
- **E2E browser verification** pending CI/staging with PostgreSQL + seed data
- **Backend integration tests** require `DATABASE_URL` and migrated schema

---

## How to Verify Locally

```bash
docker compose -f docker-compose.dev.yml up -d postgres
cp backend/.env.example backend/.env   # set DATABASE_URL
npm run db:push && npm run db:seed
npm run dev:all
```

**Seller:** `seller@pharmex.bd` / `password123` → should land on `/seller` in seller mode  
**Buyer:** `buyer@pharmex.bd` / `password123` → should land on `/`
