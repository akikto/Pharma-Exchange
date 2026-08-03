# Phase 1 — Navigation & App Shell Report

**Branch:** `cursor/phase1-nav-shell-i18n-239a`  
**Date:** 2026-08-03  
**PRD:** `docs/master-feature-specification.md` § Phase 1

---

## Feature Status

| PRD ID | Feature | Status | Notes |
|--------|---------|--------|-------|
| 1.1 | Five-tab bottom navigation | ✅ Implemented | Feed, Cart, Inventory, Chat, Profile — buyer/seller routes adapt by mode |
| 1.2 | Bengali/English bilingual UI | ✅ Implemented | `i18next` + `react-i18next`; BN default; EN fallback; bilingual nav subtitles |
| 1.3 | Material 3 theme | ✅ Implemented | Design tokens, elevation CSS vars, edge-to-edge safe areas |
| 1.4 | Snackbar feedback | ✅ Implemented | Radix Toast + `useToast` on cart, login, medicine detail |
| 1.5 | Persistent request bottom sheet | ✅ Implemented | `RequestBottomSheet` — cart + pending request summary |
| 1.6 | Modal overlays | ✅ Implemented | Search, buy-request, listing edit, auth; stubs for watchlist/comparison/bulk |

---

## Files Changed

### New
- `frontend/src/i18n/index.ts`
- `frontend/src/i18n/locales/bn.json`, `en.json`
- `frontend/src/hooks/use-nav-label.ts`, `use-toast.tsx`
- `frontend/src/stores/shell-store.ts`
- `frontend/src/components/ui/dialog.tsx`, `sheet.tsx`, `toast.tsx`
- `frontend/src/components/layout/request-bottom-sheet.tsx`, `shell-modals.tsx`
- `frontend/tests/i18n.test.ts`

### Modified
- Layout: `nav-config.ts`, `nav-link.tsx`, `app-layout.tsx`, `admin-layout.tsx`, `top-bar.tsx`, `bottom-nav.tsx`, `side-nav.tsx`
- Providers: `providers.tsx`, `main.tsx` (via i18n import), `index.css`
- Features: auth (login, splash, onboarding), home, search, cart, profile, medicine detail, chat, notifications, seller dashboard
- Tests: `nav-config.test.ts`
- Docs: merged PRD docs from prior branch

### Incorporated from PR #28
- Nav badges, side rail, admin layout, notification deep links

---

## API Changes

**None.** Phase 1 is frontend-only.

---

## Database Changes

**None.**

---

## Translation Summary

| Namespace | Keys (approx.) | Coverage |
|-----------|----------------|----------|
| nav | 14 | ✅ Full |
| common, shell, toast | 30+ | ✅ Full |
| auth, home, search | 40+ | ✅ Core screens |
| cart, orders, buyRequest | 25+ | ✅ Full |
| profile, seller, chat, notifications | 50+ | ✅ Core screens |
| admin, pharmacy, listing, modal, validation, error | 40+ | ✅ Partial |

**Default language:** Bengali (`bn`)  
**Persistence:** `localStorage` key `pharmex-locale`  
**Runtime switch:** Settings → Language selector

---

## Remaining Translation Keys (deferred to later phases)

| Screen | Status |
|--------|--------|
| `register-page.tsx` | Partial — still has English form labels |
| `forgot-password-page.tsx` | Partial |
| `listing-form-page.tsx` | Partial |
| `pharmacy-register-page.tsx` | Partial |
| `order-detail-page.tsx` | Partial |
| `buy-request-detail-page.tsx` | Partial |
| `admin-dashboard-page.tsx` | Partial |
| `seller-analytics-page.tsx` | Partial |
| `error-boundary.tsx` | Partial (class component) |
| API error messages from backend | Server-side — unchanged |

---

## Build Report

| Check | Result |
|-------|--------|
| `npm run build` | ✅ Pass |
| `npm run lint` | ✅ Pass (tsc --noEmit) |
| `npm test` | ✅ 17/17 pass |

---

## Test Report

- `nav-config.test.ts` — PRD tab structure
- `i18n.test.ts` — default BN, EN fallback, interpolation
- `notification-routes.test.ts` — unchanged
- Existing utils/status-chip/page-role tests — pass

---

## GitHub CI / Vercel

Pending push — CI expected green (no backend changes).

---

## Next Phase

**Phase 2 — Marketplace Feed (Home):** catalog comparison, pull-to-refresh, shop header, watchlist/cart header shortcuts, bulk banner.
