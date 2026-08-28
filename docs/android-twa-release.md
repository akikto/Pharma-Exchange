# Pharma Exchange — Android TWA Release Guide

**Phase:** 2 (TWA + Bubblewrap-compatible project)  
**Date:** 2026-08-27  
**Production web app:** `https://pharma-exchange-frontend.vercel.app`  
**Production API:** `https://pharma-exchange-backend.vercel.app/api/v1`  
**Android package:** `com.pharmex.exchange`  

This document re-validates Phase 1 blockers, records the TWA packaging decision, and explains how to produce a signed **`.aab`** for Google Play. It does **not** implement account deletion or merge service workers.

---

## Part A — Phase 1 blocker re-validation (2026-08-27)

### A.1 Vercel cron / background jobs

**How jobs are registered**

| Job | Schedule | Implementation | File |
|-----|----------|----------------|------|
| Buy request expiry | Hourly (`0 * * * *`) | `updateMany` PENDING → EXPIRED when `expiresAt < now` | `backend/src/jobs/index.ts` |
| Notification retention (7-day) | Daily 03:00 | `runNotificationRetentionCleanup()` | `backend/src/modules/notification/notification.retention.service.ts` |
| Stale listing maintenance | Daily 07:00 | `runStaleListingMaintenance()` | `backend/src/modules/listing/listing.stale.service.ts` |
| Listing expiry (medicine expiry date) | Daily 00:00 | ACTIVE → EXPIRED | `backend/src/jobs/index.ts` |
| Short expiry alerts | Daily 08:00 | Notifications | `backend/src/jobs/index.ts` |
| Low stock alerts | Daily 09:00 | Notifications | `backend/src/jobs/index.ts` |

**When jobs actually run**

```13:17:backend/src/server.ts
if (!process.env.VERCEL) {
  const httpServer = createServer(app);
  initializeSocket(httpServer);
  startBackgroundJobs();
```

- **Local / Docker / long-running Node:** `node-cron` schedules all jobs (`startBackgroundJobs()`).
- **Vercel serverless (`VERCEL` set):** `server.ts` HTTP listener and **all cron jobs are skipped**. `api/index.ts` only bootstraps Express per request.
- **No `vercel.json` crons** or HTTP cron routes exist in this repository for these jobs.

**Partial mitigation without cron**

| Feature | Without cron | Evidence |
|---------|--------------|----------|
| Buy request expiry | **Lazy expiry on read** — list/detail calls `markExpiredBatch` / `markExpiredIfNeeded` | `backend/src/modules/buy-request/buyRequest.service.ts` |
| Buy request UI status | **`effectiveBuyRequestStatus()`** treats past-due PENDING as expired in logic | `backend/src/modules/buy-request/buyRequest.expiry.ts` |
| Notification retention | **No lazy cleanup** — old rows remain until job runs | `notification.retention.service.ts` |
| Stale listing reminders/expiry | **No lazy path** — requires `runStaleListingMaintenance()` | `listing.stale.service.ts` |
| Listing expiry by date | **No lazy path** on seller browse (job marks EXPIRED) | `jobs/index.ts` |

**Production impact:** On the documented Vercel backend deployment, **hourly/daily automation is not running** unless you add **Vercel Cron**, an external scheduler hitting admin endpoints, or host the API on Docker/Railway with a persistent process.

**Android/TWA impact:** The wrapper loads the same production web app and API. Job gaps are **backend hosting**, not Android packaging.

**Manual action required:** Configure production job execution (recommended before marketing time-sensitive seller/buyer rules).

---

### A.2 Socket.IO / chat on Vercel serverless

**Backend**

- Socket.IO attaches only when `!process.env.VERCEL` (`backend/src/server.ts`).
- Documented limitation: `docs/vercel-backend.md` — *“Socket.IO — not supported”*.

**Frontend**

- Client: `frontend/src/lib/socket.ts` — connects to `VITE_SOCKET_URL` or same origin, path `/socket.io`.
- Production `.env.production.example` sets `VITE_SOCKET_URL=https://pharma-exchange-backend.vercel.app`.
- Chat **send** uses **REST** `POST /chat/conversations/:id/messages` (`chat-page.tsx`).
- Chat **live updates** (new messages, list refresh, typing) use Socket events (`frontend/src/hooks/use-chat.ts`).

**Behavior on current Vercel production**

| Capability | Expected on Vercel |
|------------|-------------------|
| Open chat, load history | Works (REST) |
| Send message | Works (REST) |
| Receive other party messages live | **Degraded** — no Socket.IO server |
| Conversation list auto-update | **Degraded** |
| Typing indicators | **Degraded** |

**Android/TWA impact:** Same as mobile Chrome/PWA — no change from TWA shell.

**Manual action required:** If real-time chat is required in production, run API on a host with persistent HTTP + Socket.IO (Docker compose documented) or implement polling/REST fallbacks (application change — out of scope for Phase 2).

---

### A.3 Dual service workers (Workbox + Firebase)

**Architecture**

| Worker | File | Scope | Registered by |
|--------|------|-------|---------------|
| Workbox (PWA) | `/sw.js` (Vite build) | `/` | `vite-plugin-pwa` (autoUpdate) |
| Firebase FCM | `/firebase-messaging-sw.js` | `/` | `registerFcmTokenWithBackend()` → explicit `register(..., { scope: '/' })` |

**Files:** `frontend/vite.config.ts`, `frontend/src/lib/push-notifications.ts`, `frontend/scripts/generate-fcm-sw.mjs`

**Risk:** Two workers at scope `/` — the active controller may affect precache vs push handling. **Not merged or removed in Phase 2** (per instructions).

**TWA note:** TWA uses Chrome Custom Tabs / Trusted Web Activity; PWA service worker behavior generally applies to the loaded origin. Web Push requires Firebase config at **frontend build time** (`VITE_FIREBASE_*`, `VITE_FIREBASE_VAPID_KEY`) and matching **Digital Asset Links** for notification delegation.

**Manual testing required:** Cold start, push tap → deep link, PWA update after deploy, background notification on physical Android device.

---

### A.4 Account deletion — current state (not implemented)

**What exists**

| Item | Status | Location |
|------|--------|----------|
| Privacy policy §9 “Delete account” copy | Present | `frontend/src/features/legal/privacy-policy-page.tsx`, `docs/PRIVACY-POLICY.md` |
| Terms reference | Present | `terms-and-conditions-page.tsx` |
| Settings UI | Notification prefs + legal links only | `frontend/src/features/profile/profile-page.tsx` (`SettingsPage`) |
| Backend delete-account API | **Not found** | No `deleteAccount` / `delete-account` routes |
| Email path | Documented `privacy@pharma-exchange.bd` | Legal pages (verify mailbox ownership externally) |

**What is missing**

- In-app delete flow (`Settings → Account → Delete account`)
- Re-authentication step
- Backend anonymization/deactivation workflow preserving orders/financial history
- Play Console “account deletion” URL if required

**Phase 2 action:** **None** — documented as **blocker** for Play policy alignment; do not invent deletion behavior.

---

## Part B — TWA packaging decision

### Chosen approach: **Trusted Web Activity (TWA)**

| Criterion | TWA | Why not Capacitor remote URL |
|-----------|-----|------------------------------|
| Preserves Vercel web deploy | Yes — loads production HTTPS site | Also possible, but adds native shell maintenance |
| Auth (JWT in localStorage) | Same as PWA | Same |
| Push | Web FCM + optional DelegationService | Same web stack |
| Deep links | App Links + site routes | Similar |
| `.aab` for Play | Yes | Yes |
| Rewrite frontend | No | No |

**Bubblewrap:** `twa/twa-manifest.json` matches [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) schema for `bubblewrap init` / `bubblewrap update` workflows. The repo also includes a **hand-maintained Gradle TWA project** under `twa/android/` (Android Browser Helper 2.5.0) so CI and release builds do not depend on regenerating from CLI in every environment.

---

## Part C — Pre-implementation specification

### Package name

- **`com.pharmex.exchange`**
- Must match `frontend/public/.well-known/assetlinks.json` → `target.package_name`
- Debug builds use `com.pharmex.exchange.debug` (`applicationIdSuffix` in debug buildType)

### Production URL

- **Host:** `pharma-exchange-frontend.vercel.app`
- **Launch URL:** `https://pharma-exchange-frontend.vercel.app/`
- **Web manifest URL:** `https://pharma-exchange-frontend.vercel.app/manifest.webmanifest`
- **Do not change** to localhost, preview, or staging for Play release builds.

### Digital Asset Links

**Site file (already in repo):** `frontend/public/.well-known/assetlinks.json`

Requirements:

1. Served at `https://pharma-exchange-frontend.vercel.app/.well-known/assetlinks.json` with `Content-Type: application/json` (`frontend/vercel.json` configures this).
2. `package_name` = `com.pharmex.exchange`
3. `sha256_cert_fingerprints` must include the **SHA-256 of your Android signing certificate** (upload key or Play App Signing key Google uses for verification).

**Important:** The fingerprints currently in the repo **must be verified by you**. Phase 2 **does not invent** new SHA-256 values. If they do not match your keystore, TWA will fall back to Custom Tabs (visible browser chrome) or fail verification.

Obtain fingerprint after creating keystore:

```bash
keytool -list -v -keystore twa/release.keystore -alias pharmex-release
```

Update `frontend/public/.well-known/assetlinks.json` and redeploy **frontend** before testing verified TWA.

### Signing requirements

| Item | Location | Committed? |
|------|----------|------------|
| Upload keystore | `twa/release.keystore` | **No** (gitignored) |
| Keystore properties | `twa/keystore.properties` | **No** (gitignored) |
| Example template | `twa/keystore.properties.example` | Yes |
| Bubblewrap signing ref | `twa/twa-manifest.json` → `signingKey.path` | Path only |

**Play App Signing:** Google recommends enrolling in Play App Signing. You upload with **upload key**; Google re-signs with **app signing key**. Asset Links may need the fingerprint Google documents in Play Console → App signing.

### Bubblewrap requirements

- Node.js + `@bubblewrap/cli` (optional if using Gradle project directly)
- JDK 17+
- Android SDK (API 35 build tools)
- Valid `twa-manifest.json` (validated by `node twa/scripts/validate-twa-manifest.mjs`)

Optional Bubblewrap workflow after cloning:

```bash
cd twa
npx @bubblewrap/cli doctor
npx @bubblewrap/cli update --manifest=twa-manifest.json
```

### Android target / API requirements

| Setting | Value | Source |
|---------|-------|--------|
| `minSdkVersion` | 21 | `twa-manifest.json`, `app/build.gradle` |
| `targetSdkVersion` | 35 | Play 2025 compliance target |
| `compileSdk` | 35 | `app/build.gradle` |

Google Play target API requirements change over time — confirm in Play Console before submission.

### Notification implications

- TWA enables `DelegationService` in `AndroidManifest.xml` for trusted notification delegation.
- Web app registers FCM with `platform: 'web'` (`push-notifications.ts`).
- Requires production Firebase **client** env at frontend build and **server** Firebase Admin on backend.
- **Do not** merge Workbox and FCM service workers without a measured plan (Part A.3).

### Deep-link behavior

- In-app routes: React Router (`frontend/src/app/router.tsx`).
- Push/banner deep links: `notification-routes.ts`, `banner-navigation.ts`.
- Android App Links intent filter: `https://pharma-exchange-frontend.vercel.app/*` with `android:autoVerify="true"` in `AndroidManifest.xml`.
- External banner URLs open in browser/Custom Tab per web app logic — test payment and third-party links manually.

### Authentication behavior

- JWT access token in memory; refresh token in `localStorage` (`pharmex_refresh`).
- API calls to `https://pharma-exchange-backend.vercel.app/api/v1` with `Authorization: Bearer`.
- TWA same-origin storage persists for the PWA origin — test **cold start after 24h** and refresh failure → login redirect.
- No cookies / `credentials: true` — CORS uses bearer tokens (`backend/src/app.ts`).

### Back-button behavior

- Android back navigates **WebView/TWA history** (same as Chrome back).
- React Router stacks (chat, admin, modals) — test: Home → Medicine → Cart → back chain.
- No custom `requestFullscreen()` or immersive hacks (forbidden by release brief).
- Shell uses `100dvh` in main layouts; auth/chat pages use mixed `min-h-screen` / `100vh` — verify safe areas on devices.

---

## Part D — Repository layout (Phase 2)

```
twa/
  twa-manifest.json          # Bubblewrap config (production URLs)
  keystore.properties.example
  .gitignore
  scripts/
    validate-twa-manifest.mjs
    prepare-android-resources.sh
    build-release.sh
  android/
    settings.gradle
    build.gradle
    gradle.properties
    gradle/wrapper/gradle-wrapper.properties
    app/
      build.gradle
      src/main/AndroidManifest.xml
      src/main/res/...
```

The manifest references `com.google.androidbrowserhelper.trusted.LauncherActivity` directly (no custom Java entry class required for the default TWA shell).

Launcher icons for release: copied from `frontend/public/icons/` by `prepare-android-resources.sh` (not committed under `mipmap-*` — gitignored).

---

## Part E — Commands to build the AAB

### One-time setup (local machine)

1. Install **JDK 17+** and **Android SDK** (Android Studio or command-line tools).
2. Set `ANDROID_HOME` and accept SDK licenses.
3. Create upload keystore (store outside public channels):

   ```bash
   keytool -genkey -v \
     -keystore twa/release.keystore \
     -alias pharmex-release \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

4. Copy `twa/keystore.properties.example` → `twa/keystore.properties` and fill passwords.
5. Update `frontend/public/.well-known/assetlinks.json` with your certificate SHA-256; deploy frontend.
6. Optional: install Bubblewrap — `npm i -g @bubblewrap/cli`

### Validate configuration

```bash
node twa/scripts/validate-twa-manifest.mjs
```

### Prepare launcher icons

```bash
bash twa/scripts/prepare-android-resources.sh
```

### Build signed release AAB

```bash
bash twa/scripts/build-release.sh
```

**Output:** `twa/android/app/build/outputs/bundle/release/app-release.aab`

### Debug build (CI / local smoke without signing)

```bash
bash twa/scripts/prepare-android-resources.sh
cd twa/android
gradle assembleDebug   # or ./gradlew assembleDebug if wrapper installed
```

### Increment `versionCode`

Before each Play upload, increment in **both**:

- `twa/twa-manifest.json` → `appVersionCode` / `appVersionName`
- `twa/android/app/build.gradle` → `versionCode` / `versionName`

---

## Part F — Values you must provide

| Value | Purpose |
|-------|---------|
| Upload keystore file (`release.keystore`) | Sign release AAB |
| `keystore.properties` passwords | Gradle signing |
| SHA-256 certificate fingerprint | Update `assetlinks.json` |
| Play Console app listing text, screenshots, feature graphic | Store listing |
| Privacy policy **public URL** | Play Console (may use `https://pharma-exchange-frontend.vercel.app/privacy-policy` if acceptable — confirm legally) |
| Support email | Play Console |
| Firebase production `VITE_*` on frontend Vercel project | Push in PWA/TWA |
| Firebase Admin on backend Vercel project | Push send, uploads |
| Reviewer test accounts (buyer/seller/admin) | App access — **passwords not in git** |
| Account deletion policy decision | Resolve legal/Play blocker |
| Production cron strategy | Backend job reliability |

**Do not commit:** keystore, passwords, JWT_SECRET, DATABASE_URL, FIREBASE_PRIVATE_KEY, reviewer passwords.

---

## Part G — Google Play Console settings still required

- [ ] Create app with package `com.pharmex.exchange`
- [ ] Play App Signing enrollment
- [ ] Upload `app-release.aab` to **internal testing** track first
- [ ] Store listing (short/full description, icons, screenshots, feature graphic)
- [ ] Content rating questionnaire
- [ ] Data safety form
- [ ] Privacy policy URL
- [ ] App access / reviewer credentials
- [ ] Ads declaration
- [ ] Target audience
- [ ] Permissions declaration (INTERNET; justify POST_NOTIFICATIONS if prompted)
- [ ] Account deletion declaration (blocked until implemented or policy updated)

---

## Part H — Remaining blockers

| Blocker | Severity |
|---------|----------|
| Account deletion not implemented vs privacy copy | **High** (Play/policy) |
| Asset Links fingerprints unverified | **High** (TWA verification) |
| Release keystore not in repo (by design) — you must create | **Required** |
| Vercel cron jobs not running | **Medium** (marketplace time rules) |
| Socket.IO chat degraded on Vercel | **Medium** (feature truthfulness) |
| Dual service worker risk | **Medium** (push/offline QA) |
| Store assets + legal/contact user input | **Required** for submission |

---

## Part I — Manual testing steps (TWA device)

1. Install debug or internal-test AAB on physical Android device.
2. Verify **no browser address bar** when Digital Asset Links verify (production signed build).
3. Launch → splash/login → buyer home.
4. Login as buyer (seed or test account) — confirm API calls succeed.
5. Cold start after force-stop; after 24h if possible — session refresh.
6. Android **back** through medicine detail → home → admin (if admin account).
7. Geolocation prompt on home/search — grant/deny behavior.
8. Push notification: grant permission, trigger test notification, tap → correct route.
9. External link from banner (if configured) — leaves app appropriately.
10. Seller flow: add listing (delivery mode), inventory cap warning at 50.
11. Chat: send message (REST); confirm whether live receive works (Socket limitation).
12. Offline: airplane mode → offline banner → reconnect.

---

## Part J — CI status

CI job **`android-twa`** (added in Phase 2):

- Validates `twa/twa-manifest.json`
- Runs `prepare-android-resources.sh`
- Builds **`assembleDebug`** with Gradle 8.7 + JDK 17

Release **`bundleRelease`** is **not** run in CI (requires your keystore). Check GitHub Actions after push for job result.

---

## Part K — What Phase 2 did **not** change

- No marketplace feature removals or UI redesign
- No service worker merge/delete
- No account deletion implementation
- No production URL changes
- No invented signing fingerprints or credentials
- No Bengali UI enabled

---

*For the full Phase 1 audit, see `docs/play-store-release-audit.md`.*
