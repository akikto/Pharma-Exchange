# Pharma Exchange — Google Play Release Audit (Phase 1)

**Audit date:** 2026-08-27  
**Scope:** Full repository review for production Android release and Google Play submission  
**Phase:** 1 — audit only (no application code changes in this document)  
**Auditor role:** Release engineering / repository inspection  

This audit describes what exists today, what is missing, what must change, and what must **not** change. It does **not** claim Play Store readiness.

---

## Executive summary

Pharma Exchange is a **monorepo** with a **Vite + React 19 PWA frontend** and an **Express + Prisma backend**, deployed primarily to **two Vercel projects** (frontend SPA + backend serverless API). There is **no in-repo Android project** (no `android/`, Capacitor, or Bubblewrap/TWA build yet). Play distribution today is **web/PWA-first**; `frontend/public/.well-known/assetlinks.json` is **prepared** for a Trusted Web Activity (`com.pharmex.exchange`) but **no `.aab` is produced by CI**.

**Safest Android packaging recommendation (Phase 2 decision preview):** **Trusted Web Activity (TWA)** via Bubblewrap (or equivalent) loading the **production HTTPS frontend**, with Digital Asset Links verified against the **same domain** served by Vercel. This preserves the existing marketplace without rewriting the React app. Capacitor remote-URL mode is a fallback if TWA limitations block required features; a full Capacitor hybrid rewrite is **not** recommended first.

**Top blockers for Play submission (from audit):**

1. No Android App Bundle build pipeline or signed release configuration in-repo  
2. **Account deletion** described in legal copy but **not implemented** in UI/API  
3. **Dual service workers** (Workbox PWA + Firebase messaging) both at scope `/` — risk for offline/update/push on Android WebView/TWA  
4. **Backend cron jobs** (buy-request expiry, notification retention, stale listings) **do not run on Vercel** — behavior depends on external scheduler or non-Vercel hosting  
5. **Real-time chat (Socket.IO)** documented as **not supported** on Vercel serverless  
6. Digital Asset Links **SHA-256 fingerprints** must match the **actual** Play App Signing / upload key (placeholders in repo cannot be assumed valid)  
7. Store listing assets, privacy policy **public URL**, support contact, and Data safety answers require **user-provided** information (must not be invented)

---

## 1. Current architecture

### 1.1 Monorepo layout

| Area | Path | Technology |
|------|------|------------|
| Root workspace | `package.json` | npm workspaces: `backend`, `frontend` |
| Frontend | `frontend/` | Vite 6, React 19, React Router 7, TanStack Query, Zustand, Tailwind 4, Socket.IO client, Firebase client SDK |
| Backend | `backend/` | Express 4, Prisma 6, PostgreSQL, JWT + optional Firebase ID token auth, Firebase Admin (Storage, FCM) |
| E2E | `e2e/`, `playwright.config.ts` | Playwright (Chromium, Pixel 5 profile) |
| CI | `.github/workflows/ci.yml` | security-audit, backend, frontend, typecheck, e2e, smoke, lighthouse |
| Firebase rules | `firebase/` | Firestore + Storage rules (not the main app DB) |
| Docs | `docs/` | Extensive operational and compliance markdown (partially stale vs code) |

### 1.2 Frontend architecture

- **Entry:** `frontend/src/main.tsx` → `frontend/src/app/providers.tsx` (i18n, React Query, auth, theme, router)  
- **Routing:** `frontend/src/app/router.tsx` — lazy-loaded routes; guards: `ProtectedRoute`, `SellerRoute`, `AdminRoute`  
- **Layouts:** `frontend/src/components/layout/app-layout.tsx` (buyer/seller mobile shell), `admin-layout.tsx`  
- **Features:** `frontend/src/features/` — auth, home, medicine, buyer, seller, chat, profile, watchlist, notifications, admin, legal  
- **API client:** `frontend/src/lib/api.ts` + `frontend/src/lib/api-base.ts` — JWT bearer, refresh via `/auth/refresh`, **no cookie session**  
- **Real-time:** `frontend/src/lib/socket.ts` — Socket.IO to backend (optional `VITE_SOCKET_URL`)  
- **Offline/PWA:** `vite-plugin-pwa` (Workbox), `frontend/src/lib/local-db.ts`, cloud sync helpers  
- **Push:** `frontend/src/lib/push-notifications.ts`, `frontend/src/hooks/use-push-notifications.ts`, generated `frontend/public/firebase-messaging-sw.js`  

**UI language:** English-only at runtime — `frontend/src/i18n/index.ts` loads **only** `en.json`. Bengali file exists on disk but is **not** registered. **Do not enable Bengali for Play release** without explicit product decision (user requirement: English-only production UI).

### 1.3 Backend architecture

- **App factory:** `backend/src/app.ts` — mounts `/api/v1/*` and legacy `/api/*` aliases  
- **Serverless entry:** `backend/api/index.ts` — Vercel handler; liveness on `/`, `/health` without full bootstrap  
- **Long-running server:** `backend/src/server.ts` — local/Docker; starts Socket.IO + **cron jobs** when **not** on Vercel  
- **Admin API:** `backend/src/modules/admin/admin.routes.ts` — `authenticate` + `requireAdmin` on all `/admin/*`  
- **Auth:** `backend/src/shared/middleware/auth.middleware.ts` — JWT first, Firebase ID token fallback; `requireAdmin` checks `UserRole.ADMIN`  

### 1.4 Production URLs (documented; verify in Vercel dashboard)

| Role | Documented URL | Source |
|------|----------------|--------|
| Frontend (SPA) | `https://pharma-exchange-frontend.vercel.app` | `docs/vercel-backend.md`, CORS allowlist in `backend/src/config/cors-origins.ts` |
| Alternate frontend | `https://pharma-exchange.vercel.app` | CORS allowlist |
| Backend API | `https://pharma-exchange-backend.vercel.app/api/v1` | `frontend/.env.production.example`, `docs/vercel-backend.md` |
| Health check | `https://pharma-exchange-backend.vercel.app/health` | `docs/vercel-backend.md` |

**Client build default (dev):** `VITE_API_BASE_URL=/api/v1` with Vite proxy to `localhost:3000` (`frontend/vite.config.ts`). **Android release must embed production `VITE_*` at build time** — never localhost or preview URLs.

### 1.5 Authentication architecture

| Layer | Mechanism | Files |
|-------|-----------|--------|
| Login / register | Email+password → JWT access + refresh | `backend/src/modules/auth/`, `frontend/src/stores/auth-store.ts` |
| Token storage | Access in memory; refresh in `localStorage` (`pharmex_refresh`) | `frontend/src/lib/api.ts` |
| API auth | `Authorization: Bearer <access>` | `frontend/src/lib/api.ts` |
| Optional social | Firebase Auth ID token accepted by backend | `backend/src/config/firebase.ts`, auth middleware |
| Admin | `role === ADMIN` | `requireAdmin` |
| Seller features | Verified pharmacy (`APPROVED`) | `backend/src/shared/middleware/pharmacy.middleware.ts`, `SellerRoute` |
| Session refresh | POST `/auth/refresh` | `frontend/src/lib/api.ts` |
| Logout | Clears tokens; unregisters FCM token when implemented | `push-notifications.ts` `unregisterFcmTokenFromBackend` |

**Android/TWA note:** Auth is **token-based**, not cookies — compatible with WebView/TWA **if** `localStorage` persists across WebView sessions (generally yes for same origin). Cold start after long background should re-test refresh flow manually.

### 1.6 API base URL configuration

- **Resolution:** `frontend/src/lib/api-base.ts` — normalizes bare origins to `…/api/v1`  
- **Env vars:** `VITE_API_BASE_URL` (primary), `VITE_API_URL` (legacy alias)  
- **Tests:** `frontend/tests/api-base.test.ts`  
- **Docker:** `frontend/Dockerfile` bakes `VITE_API_BASE_URL` at build  
- **Gap:** `frontend/Dockerfile` does **not** pass `VITE_FIREBASE_VAPID_KEY` (push broken in container builds unless extended)

### 1.7 Vite / PWA configuration

| Item | Location | Notes |
|------|----------|--------|
| PWA plugin | `frontend/vite.config.ts` | `vite-plugin-pwa`, `registerType: 'autoUpdate'` |
| Manifest | Inline in `vite.config.ts` | `display: 'standalone'`, `orientation: 'portrait'`, theme `#0F4C6E` |
| Workbox precache | `vite.config.ts` | JS/CSS/HTML/icons; runtime `NetworkFirst` on `/api/v1/listings/search` |
| HTML shell | `frontend/index.html` | `viewport-fit=cover`, inline splash removed on mount |
| Deploy | `frontend/vercel.json` | SPA rewrite; **no-cache** for `/sw.js`, `/manifest.webmanifest`, `/firebase-messaging-sw.js` |
| Icons | `frontend/public/icons/*`, `frontend/scripts/generate-icons.mjs` | Maskable 512 included |

**Branding inconsistency:** Manifest uses **“Pharma-Exchange”**; repo/docs also use **PharmEx**, **Pharma Exchange**, **MedLink B2B** (seed/docker). Store listing should pick **one** customer-facing name (user input: “Pharma Exchange” in Phase 10 brief).

### 1.8 Service workers

| SW | URL | Purpose | Registration |
|----|-----|---------|--------------|
| Workbox (PWA) | `/sw.js` (build output) | Precache, offline shell, listing search cache | Injected by `vite-plugin-pwa` |
| Firebase FCM | `/firebase-messaging-sw.js` | Background push, `notificationclick` navigation | `push-notifications.ts` `register('/firebase-messaging-sw.js', { scope: '/' })` |

**Risk:** Both target **scope `/`**. The last registered controller may dominate behavior. **Do not merge/delete casually** (per release brief). Phase 7 must document interaction and test on Android.

**Build:** `npm run build` → `icons` + `fcm-sw` (`frontend/scripts/generate-fcm-sw.mjs`) then `vite build`. FCM SW content depends on `VITE_FIREBASE_*` at build time.

### 1.9 Firebase configuration

**Client (public, `VITE_*`):** `frontend/src/lib/firebase.ts`, `frontend/src/vite-env.d.ts` (VAPID key used in code but **not** in `vite-env.d.ts` typings)

**Server (secret):** `backend/src/config/env.ts` — `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`

**Storage:** Public catalog paths `public/medicines/`, `public/banners/` via `backend/src/modules/upload/storage.service.ts`

**Rules:** `firebase/storage.rules`, `firebase/firestore.rules` — separate from Postgres marketplace data

### 1.10 Push notification implementation

- **Foreground:** Firebase messaging + toast → `notification-routes.ts` (`frontend/src/hooks/use-push-notifications.ts`)  
- **Background:** `firebase-messaging-sw.js` + `notificationclick` → same route map (generated in `generate-fcm-sw.mjs`)  
- **Backend:** FCM multicast in `backend/src/modules/notification/notification.service.ts`; tokens via `POST/DELETE /auth/fcm-token`  
- **Platform field:** `platform: 'web'` only in `registerFcmTokenWithBackend` — **no distinct Android/TWA label**  
- **Permission UX:** `PushPermissionPrompt` in app layout (not at cold launch by default — verify)  
- **Logout:** Attempts token delete on backend  

**TWA/Android:** Web Push in Trusted Web Activity generally uses same web FCM path if Chrome/WebView stack supports it; **must be manually verified** on physical devices.

### 1.11 Routing and deep links

**In-app routes:** `frontend/src/app/router.tsx` (buyer, seller, admin, legal)

**Notification deep links:** `frontend/src/lib/notification-routes.ts` — orders, chat, buy requests, listings, pharmacy

**Banner actions:** `frontend/src/lib/banner-navigation.ts` — `INTERNAL_PATH`, `MEDICINE`, `LISTING`, `PHARMACY`, `CATEGORY`, external URL

**Legal (public):** `/privacy-policy`, `/terms-and-conditions` (redirects from `/privacy`, `/terms`)

**TWA / App Links:** `frontend/public/.well-known/assetlinks.json` — package `com.pharmex.exchange`, relation `delegate_permission/common.handle_all_urls`. Served via `frontend/vercel.json` exception for `.well-known/*`. **Fingerprints in repo must match your signing keys** — treat as template until verified.

**No custom Android intent filters in-repo** (no native project).

### 1.12 Browser / PWA assumptions

- Designed as **mobile-first SPA** with bottom navigation, fixed admin rail on desktop  
- **Standalone** PWA display mode  
- **Geolocation** for distance/sorting: `frontend/src/hooks/use-geolocation.ts` — browser `navigator.geolocation` (seller/buyer home, search, AI Picks, medicine detail)  
- **No `requestFullscreen()`** found in release-critical paths (user forbids fake immersive fullscreen)  
- **Dynamic viewport:** `100dvh` on main shells (`app-layout.tsx`, `admin-layout.tsx`); auth pages still use `min-h-screen`; chat uses `100vh` calc — **Android Chrome/TWA testing needed**  
- **Safe areas:** `frontend/src/index.css` utilities (`.safe-bottom`, `--shell-safe-bottom`, etc.)

### 1.13 Existing Android-related files

| File | Status |
|------|--------|
| `frontend/public/.well-known/assetlinks.json` | Present — TWA Digital Asset Links |
| `docs/play-store-checklist.md` | Guidance only |
| `docs/PLAY-STORE-COMPLIANCE.md` | Partially **inaccurate** (claims permissions folder, account deletion) |
| `docs/store-readiness.md` | **Stale** (claims assetlinks missing) |
| `android/`, Capacitor, Bubblewrap project | **Absent** |
| `.aab` / `.apk` artifacts | **Not built in CI** |

### 1.14 `package.json` and build scripts

**Root (`package.json`):** `build`, `test`, `test:e2e`, `smoke`, `lint`, `lighthouse:ci`, `audit:ci`

**Frontend (`frontend/package.json`):** `build` = `icons` + `fcm-sw` + `tsc -b` + `vite build`

**Backend (`backend/package.json`):** `build` = `tsc` + vendor/assets copy; `vercel-build` = Prisma + schema sync + build

### 1.15 Environment variables (summary)

See **Phase 3 preview** below. Canonical references:

- Root: `.env.example`  
- Frontend: `frontend/.env.example`, `frontend/.env.production.example`  
- Backend: `backend/.env.example`, `backend/.env.production.example`  
- Ops: `docs/ENVIRONMENT-SETUP.md`, `docs/vercel-backend.md`  

**Rule:** `VITE_*` are **public** in the browser bundle. **Never** put `JWT_SECRET`, `DATABASE_URL`, or `FIREBASE_PRIVATE_KEY` in frontend env.

### 1.16 Deployment configuration

| Target | Config | Notes |
|--------|--------|--------|
| Frontend Vercel | `frontend/vercel.json` | SPA, security headers, asset caching |
| Backend Vercel | `backend/vercel.json` | Single serverless function `api/index.ts`, region `sin1`, Prisma + vendor includeFiles |
| Docker full stack | `docker-compose.yml`, `frontend/Dockerfile`, `backend/Dockerfile`, `docker/nginx.conf` | Socket + cron possible; nginx Permissions-Policy **stricter** than Vercel on camera/geo |
| Backend docs | `docs/vercel-backend.md`, `docs/BL-03-VERCEL-AUDIT.md` | Documents Vercel limitations |

### 1.17 CI/CD (current)

`.github/workflows/ci.yml`:

- **security-audit** → **backend** (Postgres service, migrate, seed, lint, build, test) → **frontend** (lint, build, test, a11y)  
- **typecheck** (root lint)  
- **e2e** (Playwright, auto-starts API + Vite)  
- **smoke** (`scripts/smoke-test.sh` against local API)  
- **lighthouse** (frontend build + LHCI)  

**No Android build job.** **Do not weaken** existing jobs to go green.

### 1.18 Tests (inventory)

| Suite | Count / location | Android relevance |
|-------|------------------|-----------------|
| Frontend Vitest | ~89 files in `frontend/tests/` | Logic/UI units; no WebView |
| Backend Vitest | `backend/tests/` | API, auth, listings, notifications, buy-request expiry, etc. |
| Playwright | 15 specs in `e2e/` | Mobile viewport (Pixel 5); **not** real Android |
| Smoke | `scripts/smoke-test.sh` | API-only |

**Gaps vs feature list:** No E2E for notification bulk delete, 50-listing cap, buy-request expiry UI, banner LISTING click on device.

### 1.19 Existing documentation (selected)

Legal content sources: `docs/PRIVACY-POLICY.md`, `docs/TERMS-AND-CONDITIONS.md` → rendered in-app via `frontend/src/features/legal/*`.

Operational: `docs/PRODUCTION-CHECKLIST.md`, `docs/production-launch-checklist.md`, `docs/deployment-guide.md`.

**Drift warning:** Several docs predate current CI, assetlinks, and account-deletion gap. **This audit supersedes them for Play release planning** where they conflict.

---

## 2. What already works (evidence in codebase)

Features below are **implemented in code** with tests and/or routes unless noted. **“Works” does not mean verified on Android** until Phase 4/15 manual testing.

### Marketplace core

- Buyer home, search, medicine detail, cart, watchlist, comparison, pharmacy pages  
- Seller inventory, add/edit listing, orders, buy-request responses, analytics hooks  
- Admin dashboard, verifications, sellers CRUD, medicines CRUD, import/export (static template on serverless), banners (including **LISTING** shop item), payments, reports, notifications broadcast  
- AI Picks horizontal card (`frontend/src/components/home/home-ai-pick-listing-card.tsx`) — 70/30 layout, listing navigation, add to cart  
- Listing detail insights — delivery mode, distance, expiry, clinical fields where present (`listing-detail-insights.tsx`, seller form + backend schema)  

### Policy / limits (recent mainline work — do not revert)

- **50 active listings** per pharmacy — `backend/src/modules/listing/listing.constants.ts`, `listing.active-cap.test.ts`, seller UI warnings  
- **Buy request 3-day seller response expiry** + resend — `buyRequest.constants.ts`, cron in `backend/src/jobs/index.ts`, frontend utils/pages  
- **Notification 7-day retention** + delete one / bulk / all — `notification.retention.*`, `notifications-page.tsx`, API tests  
- **Admin seller management** — admin routes + pages  
- **Admin-only medicine catalog image upload** — `POST /upload/medicine-image` + `requireAdmin`; seller listing `imageUrl` stripped — `listing.service.ts` `stripSellerImageUrlOverride`  
- **Admin navigation** profile ↔ dashboard ↔ marketplace — covered by frontend tests (admin layout / nav tests)  

### Auth & security (backend)

- Admin routes require JWT + `ADMIN` role  
- Production env validation (CORS, JWT length, SMTP, password reset base URL) — `backend/src/config/env.ts`  
- Rate limiting — `rateLimit.middleware.ts` (in-memory per instance on Vercel)  
- Medicine image upload tests — seller 403, admin 200 — `medicine-image-upload.api.test.ts`  

### PWA / release prep (partial)

- Manifest, icons, maskable icon, standalone display  
- Legal routes in-app  
- `assetlinks.json` template for TWA  
- English-only UI runtime  

---

## 3. What is missing

| Gap | Impact |
|-----|--------|
| Android project + **signed `.aab`** build | **Blocks Play submission** |
| Verified Digital Asset Links matching **your** signing certificate | TWA may show browser chrome or fail verification |
| Account deletion UI + API | **Play policy / privacy copy mismatch** |
| Public **privacy policy URL** for Console (can be app route if stable HTTPS — user must confirm) | Store listing |
| Support email / contact (not in repo as real values) | Store listing |
| Data safety form answers | User input required |
| Screenshot / feature graphic / final icon 512 Play assets | Marketing (icons exist for PWA; Play has separate requirements) |
| Android-specific CI job | Optional but recommended |
| Cron on production (if staying on Vercel) | Expiry/retention/stale listing automation |
| Consolidated service worker strategy documentation + device tests | Push/offline reliability on Android |
| `platform: 'android'` or WebView FCM validation | Push on installed app |
| Play reviewer demo accounts (placeholders only in git) | App access section |

---

## 4. What must be changed (for Play release)

Changes listed here are **recommendations for Phases 2–15** — **not implemented in Phase 1**.

1. **Add Android packaging** (TWA recommended) with production URL, correct `applicationId` (`com.pharmex.exchange` aligns with assetlinks), versionCode/versionName, release signing **outside git**.  
2. **Verify/update `assetlinks.json`** SHA-256 with Play App Signing or upload key fingerprint.  
3. **Implement account deletion** (or change legal copy — product/legal decision) — backend soft-delete vs anonymize; preserve orders/financial records.  
4. **Production frontend build** for Android wrapper with `VITE_API_BASE_URL` and full Firebase client vars including **VAPID**.  
5. **Resolve cron gap** on Vercel (Vercel Cron, external worker, or migrate long-running jobs) so buy-request expiry, notification retention, stale listings remain correct in production.  
6. **Document and test dual-SW behavior** on Android; adjust only with measured plan (Phase 7).  
7. **Chat strategy on production** — if API stays on Vercel, real-time chat may be degraded; document limitation or host Socket.IO elsewhere.  
8. **Align Docker/nginx Permissions-Policy** with Vercel if Docker used for any production path (geolocation for distance features).  
9. **Remove or update stale docs** that claim Play readiness / account deletion / missing assetlinks.  
10. **Add Phase 10–13 docs** (listing, checklist, review access, build guide) — separate deliverables per user brief.  

---

## 5. What must NOT be changed

- **Feature set:** Do not remove buyer/seller/admin/marketplace, AI Picks, banners (including LISTING), medicine import/export, notifications bulk actions, buy-request expiry/resend, 50-listing cap, seller stale listing behavior, delivery fields on listings, admin-only medicine images.  
- **API contracts** unless required for Android (prefer client/wrapper config over breaking API).  
- **English-only production UI** — do not enable Bengali locale in `i18n` for release.  
- **Auth model** (JWT bearer) — do not switch to cookie-only without full regression.  
- **Seller medicine catalog upload restriction** — keep admin-only on `POST /upload/medicine-image` and listing strip logic.  
- **No fake fullscreen** — do not add `requestFullscreen()` to hide URL bar.  
- **Existing `100dvh` / safe-area shell** — preserve; extend consistently rather than replacing with hacks.  
- **Historical data** — orders, buy requests, reviews, payment records must not be hard-deleted by account deletion without explicit policy.  
- **CI quality bar** — do not skip failing tests or remove security-audit/e2e to greenwash Android work.  

---

## 6. Android packaging recommendation

### Options evaluated

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A. TWA (Bubblewrap)** | Minimal change; uses production Vercel site; assetlinks already started; standalone PWA manifest | Web Push/SW quirks; Chrome dependency; Digital Asset Links must be exact | **Recommended first** |
| **B. Capacitor (remote URL)** | Play-native shell; plugins if needed later | Extra native project maintenance; still WebView; push/deep links config work | **Fallback** if TWA blocks a hard requirement |
| **C. Capacitor (bundled web assets)** | Offline shell possible | Must rebuild/republish app for every web deploy; duplicates Vercel CDN model | **Not recommended** for current deployment model |
| **D. Custom WebView wrapper** | Same as TWA without Chrome Custom Tabs quality | More code for same outcome | **Skip** — use Bubblewrap |

### Recommended approach: **Trusted Web Activity**

- **Host URL:** Production frontend HTTPS origin (documented: `pharma-exchange-frontend.vercel.app` — confirm custom domain if added).  
- **Package name:** `com.pharmex.exchange` (matches `assetlinks.json`).  
- **Launch mode:** Default URL = `/` or `/splash` as per product; verify auth redirect paths.  
- **External links:** Policy for `window.open` / target=_blank (payment, external banner URLs) — test in Phase 4.  
- **Back navigation:** TWA / Chrome handles history; app uses React Router — test deep stacks (chat, admin).  
- **Authentication:** Same-origin localStorage refresh — test cold start after 24h.  
- **Do not** ship a wrapper pointing to `localhost`, preview URLs, or unauthenticated staging without reviewer docs.  

**Implementation location (Phase 2):** New directory e.g. `android/twa/` or `twa/` with Bubblewrap config — **not present yet**.

---

## 7. Google Play requirements that apply (high level)

| Requirement | Applies? | Repo status |
|-------------|----------|-------------|
| Target API level / 64-bit | Yes | N/A until Android project exists |
| App Bundle (`.aab`) | Yes | Not generated |
| Data safety form | Yes | Needs user input |
| Privacy policy URL | Yes | In-app routes exist; **public URL** must be confirmed |
| Account deletion (if accounts exist) | Yes | **Documented, not implemented** |
| Permissions declaration | Yes | Geolocation + notifications used in web; camera/mic policies vary by host |
| Content rating questionnaire | Yes | User input |
| Ads declaration | Likely “No ads” | Confirm with product |
| Login credentials for reviewers | Yes | Seed accounts in DB seed — **passwords must not be committed** |
| Store listing assets | Yes | Templates only |
| Play App Signing | Yes | User configures in Console |

**Medical claims:** App is B2B marketplace software — store copy must **not** make unsupported medical claims (Phase 10).

---

## 8. Risks and blockers

### Blockers (release cannot complete until resolved)

1. **No `.aab` build**  
2. **Account deletion** mismatch with privacy/terms  
3. **User-provided** store metadata (support email, privacy URL policy choice, company details)  
4. **Asset links** certificate mismatch → broken TWA trust  

### High risks (may ship with documented limitations)

1. **Dual service workers** — offline/update/push conflicts  
2. **Vercel cron absent** — time-based marketplace rules diverge from spec  
3. **Socket.IO on Vercel** — chat real-time may fail in production API hosting  
4. **FCM as `platform: 'web'`** inside TWA — may work but unverified  
5. **In-memory rate limits** on multi-instance serverless  
6. **JWT access token 7-day TTL** — security vs UX tradeoff on shared devices  

### Medium risks

1. Viewport inconsistencies (`100dvh` vs `min-h-screen` / `100vh` in chat/auth)  
2. Brand name inconsistency across manifest, Docker, store  
3. Stale compliance docs misleading stakeholders  
4. Docker vs Vercel Permissions-Policy difference for geolocation  

---

## 9. Exact files involved (by concern)

### Android / Play (future)

- `frontend/public/.well-known/assetlinks.json`  
- `frontend/vite.config.ts` (manifest)  
- `frontend/public/icons/*`  
- New: TWA/Bubblewrap project (TBD), `AndroidManifest.xml`, Gradle signing configs (**secrets outside git**)

### Frontend production build

- `frontend/.env.production.example`  
- `frontend/vite.config.ts`  
- `frontend/package.json` (`build`, `fcm-sw`)  
- `frontend/scripts/generate-fcm-sw.mjs`  
- `frontend/scripts/generate-icons.mjs`  
- `frontend/vercel.json`  

### Auth / API

- `frontend/src/lib/api.ts`, `frontend/src/lib/api-base.ts`  
- `frontend/src/stores/auth-store.ts`  
- `backend/src/shared/middleware/auth.middleware.ts`  
- `backend/src/config/env.ts`, `backend/src/config/cors.ts`, `backend/src/config/cors-origins.ts`  

### Push / SW

- `frontend/src/lib/push-notifications.ts`  
- `frontend/src/lib/firebase.ts`  
- `frontend/public/firebase-messaging-sw.js`  
- `frontend/src/lib/notification-routes.ts`  
- `backend/src/modules/notification/notification.service.ts`  
- `backend/src/modules/auth/auth.routes.ts` (FCM token)

### Admin / medicine security

- `backend/src/modules/upload/upload.routes.ts`  
- `backend/src/modules/upload/upload.controller.ts`  
- `backend/src/modules/listing/listing.service.ts`  
- `backend/src/modules/medicine/medicine.routes.ts`  
- `backend/tests/medicine-image-upload.api.test.ts`  

### Legal / privacy

- `frontend/src/features/legal/privacy-policy-page.tsx`  
- `frontend/src/features/legal/terms-and-conditions-page.tsx`  
- `frontend/src/features/profile/profile-page.tsx` (Settings — **no delete UI**)  
- `docs/PRIVACY-POLICY.md`, `docs/TERMS-AND-CONDITIONS.md`  

### CI/CD

- `.github/workflows/ci.yml`  
- `scripts/smoke-test.sh`  
- `playwright.config.ts`  
- `lighthouserc.cjs`  

### Backend deploy / jobs

- `backend/vercel.json`  
- `backend/api/index.ts`  
- `backend/src/server.ts`  
- `backend/src/jobs/index.ts`  

---

## 10. Feature audit snapshot (Phase 5 preview)

Status key: **Implemented (code)** | **Partial** | **Not found** | **Needs Android manual test**

### Buyer

| Feature | Status | Primary files |
|---------|--------|---------------|
| Home, AI Picks, deals, listings | Implemented | `home-page.tsx`, `ai-match-section.tsx`, `home-ai-pick-listing-card.tsx` |
| Medicine details, search, cart, watchlist | Implemented | `features/medicine`, `features/buyer`, `cart` routes |
| Chat | Implemented (depends on Socket hosting) | `chat-page.tsx`, `backend/src/modules/chat/` |
| Buy requests + resend expired | Implemented | `buy-request/*`, `buyRequest.expiry.ts` |
| Profile, notifications | Implemented | `profile-page.tsx`, `notifications-page.tsx` |

### Seller

| Feature | Status | Primary files |
|---------|--------|---------------|
| Profile, add/edit listing, delivery fields | Implemented | `listing-form-page.tsx`, listing schema |
| 50 active listing cap | Implemented | `listing.constants.ts`, seller UI |
| Stale listing reminder / auto expiry | Implemented (cron on non-Vercel) | `listing.stale.service.ts`, `jobs/index.ts` |
| Medicine image preview (catalog) | Implemented (read-only for seller) | medicine relation on listings |
| Seller cannot upload catalog images | Implemented | upload route + listing strip |

### Admin

| Feature | Status | Primary files |
|---------|--------|---------------|
| Dashboard, sellers, verification, medicines | Implemented | `features/admin/*` |
| Import/export template | Implemented | `medicine-import-*`, static asset on serverless |
| Banners incl. shop item LISTING | Implemented | `banner-form-dialog.tsx`, `BannerActionType.LISTING` |
| Notifications broadcast | Implemented | admin routes + notification service |

### Notifications UX

| Feature | Status |
|---------|--------|
| 7-day retention | Implemented (cron caveat) |
| Delete one / selected / all | Implemented |

### AI Picks / listing detail

| Feature | Status |
|---------|--------|
| Horizontal 70/30 card | Implemented |
| Detail: expiry, distance, delivery, clinical fields | Implemented (where data exists) |

**All above require Android/TWA manual regression** in Phase 4/15.

---

## 11. Permissions preview (Phase 6)

| Permission / capability | Used? | Feature | Declared (Android) | Notes |
|----------------------|-------|---------|-------------------|--------|
| INTERNET | Yes | Entire app | N/A until manifest | Required |
| POST_NOTIFICATIONS | Likely | FCM web push | N/A | Android 13+ runtime |
| Geolocation | Yes | Distance, AI Picks, search | N/A | Browser prompt; not at launch |
| Camera / photos | Unclear web upload | Pharmacy docs via `/upload/document` | Host Permissions-Policy | Vercel allows geolocation `(self)`; nginx Docker may block |
| Microphone | Voice upload route exists | Chat voice? | Policy varies | `/upload/voice` backend |
| Storage | PWA cache | Workbox | N/A | Not classic Android storage |

**Phase 6:** Map web APIs to Play Data safety + manifest after Android project exists. **Minimize** permissions.

---

## 12. Security preview (Phase 8)

| Check | Status |
|-------|--------|
| Admin API protection | Implemented (`requireAdmin`) |
| Seller catalog image upload blocked | Implemented + tests |
| JWT in frontend (not secrets in VITE) | OK |
| CORS production enforcement | OK |
| Production error messages generic | OK (`errorHandler.ts`) |
| File upload auth on generic `/upload/*` | Any authenticated user — **review scope** (documents/voice) |

---

## 13. Privacy / account deletion preview (Phase 9)

| Item | Status |
|------|--------|
| Privacy policy in-app | Implemented |
| Terms in-app | Implemented |
| Account deletion | **Missing** — legal text references Settings → Delete account |
| Data deletion behavior | **Not defined in code** |
| Order/financial history preservation | Must be preserved per release brief |

**Blocker report (no invented policy):** Implement deletion flow or revise legal copy with legal review. Backend must define anonymization vs deactivation and retention for orders, buy requests, payments, reviews.

---

## 14. Recommended implementation order (Phases 2–17)

1. **Phase 1** — This audit ✅  
2. **Phase 3** — Env var matrix audit (client vs server); confirm production Vercel values  
3. **Phase 2** — Choose TWA; create Bubblewrap project; verify assetlinks + production URL  
4. **Phase 9** — Resolve account deletion blocker (product + backend design)  
5. **Phase 7** — Service worker + FCM strategy on Android test devices  
6. **Phase 4** — Android behavior matrix (back, keyboard, viewport, cold start)  
7. **Phase 6** — Android manifest permissions minimum set  
8. **Phase 8** — Security pass (no regression on admin/medicine upload)  
9. **Phase 13** — Release signing docs + `.aab` generation (keys outside repo)  
10. **Phase 10–12** — Store listing templates, Console checklist, reviewer access placeholders  
11. **Phase 14** — CI Android build job (optional, non-blocking of web CI)  
12. **Phase 15** — Release smoke checklist execution on physical devices  
13. **Phase 17** — Final readiness report with READY / NOT READY / BLOCKED  

**Parallel concern:** Production cron + Socket.IO hosting decision (may be independent of Android shell but affects feature truthfulness on Play).

---

## 15. Phase 1 completion statement

| Deliverable | Status |
|-------------|--------|
| Repository inspected | Yes |
| `docs/play-store-release-audit.md` created | Yes |
| Application code modified | **No** (Phase 1 only) |
| Phase 2+ implementation | **Not started** (awaiting approval after audit review) |

**Next step for product owner:** Review this audit, confirm production domain(s) and signing approach, decide account deletion scope, then authorize **Phase 2 (TWA packaging)**.

---

*End of Phase 1 audit.*
