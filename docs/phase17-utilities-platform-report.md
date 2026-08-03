# Phase 17 — Utilities & Platform Report

**Branch:** `cursor/phase17-utilities-platform-239a`  
**Base:** `cursor/phase16-local-persistence-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 17.1 | Gemini env docs | ❌ Missing | ✅ `GEMINI_API_KEY` / `GEMINI_MODEL` in deployment checklist + Vercel backend docs |
| 17.3 | File sharing | 🟡 Inline in inventory | ✅ Shared `download-utils` (CSV download + Web Share fallback) |
| 17.5 | RTL support | ❌ Missing | ✅ `dir="rtl"` on `<html>` when Bengali locale is active |
| 17.7 | Test tags | 🟡 Partial | ✅ `data-testid` on bottom nav, side nav, cart panel, listing cards |
| — | Accessibility | 🟡 Partial | ✅ Focus-visible rings, `prefers-reduced-motion`, text scaling base styles |
| — | Home top bar scroll collapse | Deferred | ⏭️ Unchanged (deferred from Phase 1) |

---

## Files Changed

### Documentation

| File | Change |
|------|--------|
| `docs/deployment-checklist.md` | Gemini + VAPID env vars |
| `docs/vercel-backend.md` | Backend Gemini vars; frontend VAPID |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/lib/download-utils.ts` | CSV/text download + share helper |
| `frontend/src/lib/rtl-utils.ts` | Document direction helpers |
| `frontend/src/i18n/index.ts` | Apply `dir` on language change |
| `frontend/src/index.css` | Focus rings, reduced motion, RTL utility |
| `frontend/src/components/listing-card.tsx` | `data-testid` |
| `frontend/src/components/layout/bottom-nav.tsx` | `data-testid` |
| `frontend/src/components/layout/side-nav.tsx` | `data-testid` |
| `frontend/src/components/cart/cart-tab-panel.tsx` | `data-testid` |
| `frontend/src/features/seller/seller-inventory-page.tsx` | Use download utils |
| `frontend/src/components/orders/order-receipt-dialog.tsx` | Use download utils |
| `frontend/tests/download-utils.test.ts` | Unit tests |
| `frontend/tests/rtl-utils.test.ts` | Unit tests |

---

## Quality Gates

| Check | Result |
|-------|--------|
| Backend tests | 84 passed (unchanged) |
| Frontend tests | 70 passed |
| `tsc --noEmit` | Pass |
