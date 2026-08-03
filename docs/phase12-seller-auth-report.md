# Phase 12 — Seller Authentication Report

**Branch:** `cursor/phase12-seller-auth-239a`  
**Base:** `cursor/phase11-shop-profile-239a`  
**Date:** 2026-08-03

---

## Feature Status (PRD vs Implementation)

| ID | Feature | Before | After |
|----|---------|--------|-------|
| 12.3 | Google Sign-In | ❌ No UI | ✅ Google button when Firebase env is configured |
| 12.4 | Guest/demo login | ❌ Missing | ✅ `POST /auth/demo-login` + Try demo button |
| 12.7 | Password visibility | 🟡 Login only | ✅ Reusable `PasswordInput` on login, register, reset |
| 12.8 | Login/register tabs | 🟡 Separate routes | ✅ Segmented Sign In / Create Account on `/login` |
| 12.9 | Account dashboard | ❌ Missing | ✅ `AuthWelcomeCard` summary before entering app |

---

## Remaining Gaps (Future Phases)

| Feature | Notes |
|---------|-------|
| Google Sign-In in production | Requires `VITE_FIREBASE_*` client env vars |
| Demo login in production | Blocked by backend (`NODE_ENV === 'production'`) |
| Firebase session restore in UI | JWT refresh still handles session; Firebase client session optional |

---

## Files Changed

### Backend

| File | Change |
|------|--------|
| `backend/src/modules/auth/auth.service.ts` | `demoLogin()` for seeded buyer |
| `backend/src/modules/auth/auth.controller.ts` | Demo login handler |
| `backend/src/modules/auth/auth.routes.ts` | `POST /auth/demo-login` |
| `backend/tests/auth.demo-login.test.ts` | Integration test |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/features/auth/login-page.tsx` | Unified auth screen with tabs, demo, welcome card |
| `frontend/src/features/auth/forgot-password-page.tsx` | i18n + `PasswordInput` |
| `frontend/src/components/auth/password-input.tsx` | Reusable eye toggle |
| `frontend/src/components/auth/auth-welcome-card.tsx` | Post-login summary |
| `frontend/src/components/auth/google-sign-in-button.tsx` | Google popup sign-in |
| `frontend/src/lib/firebase.ts` | `signInWithGoogle()` helper |
| `frontend/src/stores/auth-store.ts` | `demoLogin()` |
| `frontend/src/app/router.tsx` | `/register` redirects to `/login?tab=register` |
| `frontend/tests/auth-firebase.test.ts` | Unit test |
| `frontend/src/i18n/locales/bn.json` | Bengali-first strings |
| `frontend/src/i18n/locales/en.json` | English strings |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/demo-login` | One-click demo buyer session (non-production) |

---

## Quality Gates

| Check | Result |
|-------|--------|
| Backend tests | 79 passed |
| Frontend tests | 54 passed |
| `tsc --noEmit` | Pass |
