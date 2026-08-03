# Phase 11 — Shop Profile & Identity Report

**Branch:** `cursor/phase11-shop-profile-239a`  
**Base:** `cursor/phase10-in-app-chat-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 11.1 | Full profile | 🟡 Name, rating, city only | ✅ Owner, license, deals completed, address, description |
| 11.2 | Multi-shop switching | ❌ Missing | ✅ Demo shop switcher on home feed (localStorage) |
| 11.3 | Contact actions | ❌ Missing | ✅ Call, WhatsApp, and in-app message on profile |
| 11.4 | Verified shop badge | 🟡 Text only | ✅ Reusable `VerifiedBadge` on profile, offers, header |

---

## Remaining Gaps (Future Phases)

| Feature | Notes |
|---------|-------|
| Shop logo upload | `logoUrl` in schema; no upload UI yet |
| Edit pharmacy profile | Read-only public profile for buyers |
| Persistent multi-account switching | Demo switcher filters feed; not full seller impersonation |

---

## Files Changed

### Backend

| File | Change |
|------|--------|
| `backend/src/modules/pharmacy/pharmacy.service.ts` | Full public profile + `listDemoShops()` |
| `backend/src/modules/pharmacy/pharmacy.routes.ts` | `GET /pharmacies/demo-shops` |
| `backend/prisma/seed.ts` | Green Care + MediPlus Sylhet demo pharmacies |
| `backend/tests/pharmacy.profile.integration.test.ts` | Profile API tests |
| `backend/tests/chat.integration.test.ts` | Fix seller pharmacy scoping |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/features/medicine/medicine-detail-page.tsx` | Full `PharmacyProfilePage` |
| `frontend/src/components/pharmacy/verified-badge.tsx` | Reusable shield badge |
| `frontend/src/components/pharmacy/pharmacy-contact-actions.tsx` | Call/WhatsApp/chat |
| `frontend/src/components/home/shop-header.tsx` | Shop switcher + profile link |
| `frontend/src/stores/demo-shop-store.ts` | Persisted active shop selection |
| `frontend/src/hooks/use-pharmacy.ts` | Profile + demo shops hooks |
| `frontend/src/lib/shop-utils.ts` | Address formatting + shop resolution |
| `frontend/src/features/home/home-page.tsx` | Filter feed by selected demo shop |
| `frontend/src/components/offers/offer-card.tsx` | Use `VerifiedBadge` |
| `frontend/src/features/profile/profile-page.tsx` | Verified badge on user pharmacy |
| `frontend/tests/shop-utils.test.ts` | Unit tests |
| `frontend/src/i18n/locales/bn.json` | Bengali-first strings |
| `frontend/src/i18n/locales/en.json` | English strings |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/pharmacies/demo-shops` | Approved pharmacies for demo switcher |
| GET | `/pharmacies/:id` | Full public profile (owner, license, deals, address) |

---

## Quality Gates

| Check | Result |
|-------|--------|
| Backend tests | 78 passed |
| Frontend tests | 53 passed |
| `tsc --noEmit` | Pass |
