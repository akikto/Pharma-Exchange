# Store Readiness — Pharma-Exchange v1.0.1-rc1

**Date:** 2026-08-04  
**Distribution:** PWA (web) + Trusted Web Activity (Play Store)  
**App name:** Pharma-Exchange / PharmEx

---

## Summary

| Area | Status |
|------|--------|
| PWA manifest | ✅ Generated |
| Icons (48–512, maskable, apple-touch) | ✅ In repo |
| Screenshots for store | ❌ Not created |
| Privacy Policy | ❌ Not published |
| Terms & Conditions | ❌ Not published |
| TWA / Bubblewrap | ❌ Not built |
| Play Store listing | ❌ Not submitted |

**Store launch:** **NO-GO** until legal URLs and TWA build are complete.

---

## 1. Privacy Policy Checklist

Publish at a stable HTTPS URL (e.g. `https://pharma-exchange.vercel.app/legal/privacy` or external site).

### Required sections

- [ ] **Data controller** — Company name, address, contact email
- [ ] **Data collected**
  - [ ] Account: name, email, phone, pharmacy license info
  - [ ] Transaction: orders, cart, buy requests
  - [ ] Device: FCM tokens, browser type
  - [ ] Optional: Google account (Firebase Auth)
- [ ] **Purpose of processing** — B2B marketplace, order fulfillment, notifications
- [ ] **Legal basis** — Contract, legitimate interest, consent (marketing/notifications)
- [ ] **Third parties**
  - [ ] Firebase (Google) — auth, push, storage
  - [ ] Vercel — hosting
  - [ ] PostgreSQL provider — database
  - [ ] Future: SMS OTP provider, payment gateway
- [ ] **Data retention** — How long orders, messages, and accounts are kept
- [ ] **User rights** — Access, correction, deletion requests
- [ ] **Account deletion process** — Steps to request erasure
- [ ] **Children** — Not intended for under-18 (if applicable)
- [ ] **International transfers** — If data leaves Bangladesh
- [ ] **Cookies / local storage** — `pharmex-auth`, `pharmex_refresh`, IndexedDB, service worker cache
- [ ] **Security measures** — HTTPS, JWT, encryption at rest (DB provider)
- [ ] **Changes to policy** — Notification method
- [ ] **Contact** — DPO or privacy email

### App integration

- [ ] Link in app Settings / Profile
- [ ] Link on registration screen
- [ ] URL entered in Google Play Console → App content → Privacy policy

---

## 2. Terms & Conditions Checklist

Publish at stable HTTPS URL (e.g. `/legal/terms`).

### Required sections

- [ ] **Parties** — Platform operator vs pharmacy buyers/sellers
- [ ] **Eligibility** — Licensed pharmacies in Bangladesh; verification requirement
- [ ] **Account registration** — Accurate information, one account per entity
- [ ] **Seller obligations** — Valid licenses, accurate listings, stock availability
- [ ] **Buyer obligations** — Licensed procurement, payment terms
- [ ] **Orders & fulfillment** — Order lifecycle, cancellation policy
- [ ] **Payments** — Manual until gateway integrated; future bKash/SSLCommerz terms
- [ ] **Fees & commissions** — If any
- [ ] **Prohibited conduct** — Fraud, counterfeit medicines, off-platform circumvention
- [ ] **Intellectual property** — PharmEx branding, user content license
- [ ] **Disclaimers** — Platform is intermediary; not medical advice
- [ ] **Limitation of liability**
- [ ] **Indemnification**
- [ ] **Governing law** — Laws of Bangladesh
- [ ] **Dispute resolution** — Courts / arbitration
- [ ] **Termination** — Account suspension for violations
- [ ] **Changes to terms** — Notice period
- [ ] **Contact**

### App integration

- [ ] Accept checkbox on registration (link to Terms + Privacy)
- [ ] Link in Settings
- [ ] Play Console → Terms of service (if required)

---

## 3. PWA Manifest Verification

**Source:** `frontend/vite.config.ts` → `VitePWA` manifest (built to `dist/manifest.webmanifest`)

| Field | Value | Status |
|-------|-------|--------|
| `name` | Pharma-Exchange — B2B Pharmacy Marketplace | ✅ |
| `short_name` | Pharma-Exchange | ✅ |
| `description` | B2B Pharmacy Marketplace | ✅ |
| `theme_color` | `#0F4C6E` | ✅ |
| `background_color` | `#0F4C6E` | ✅ |
| `display` | `standalone` | ✅ |
| `orientation` | `portrait` | ✅ |
| `start_url` | `/` | ✅ |
| `scope` | `/` | ✅ |
| `icons` | 48–512 + maskable | ✅ |

**Vercel headers:** `manifest.webmanifest` → `Cache-Control: no-cache` ✅

**Verify after deploy:**
```bash
curl -sI https://<frontend>/manifest.webmanifest
curl -s https://<frontend>/manifest.webmanifest | jq .
```

---

## 4. Icons, Screenshots, and Branding

### Icons (in repo)

| Asset | Path | Status |
|-------|------|--------|
| 48–512 PNG set | `frontend/public/icons/icon-*.png` | ✅ |
| Maskable 512 | `frontend/public/icons/icon-maskable-512.png` | ✅ |
| Apple touch 180 | `frontend/public/icons/apple-touch-icon.png` | ✅ |
| Favicon | `frontend/public/favicon.ico` | ✅ |
| Logo | `frontend/public/logo.png` | ✅ |
| Source asset | `frontend/public/icons/logo-source.png` | ✅ (exclude from prod precache if possible) |

### Screenshots (required for Play Store — not in repo)

| Type | Size | Status |
|------|------|--------|
| Phone screenshots | Min 2; 16:9 or 9:16 | ❌ Create from staging |
| 7-inch tablet | Optional | ❌ |
| 10-inch tablet | Optional | ❌ |
| Feature graphic | 1024 × 500 | ❌ |

**Suggested captures:**
1. Home / marketplace feed
2. Medicine comparison
3. Cart & checkout
4. Seller inventory
5. Order tracking
6. Admin verification queue

### Branding consistency

| Item | Status |
|------|--------|
| Theme color `#0F4C6E` in manifest + CSS | ✅ |
| PharmEx logo on login/splash | ✅ |
| Bengali primary + English sub-labels | ✅ |

---

## 5. TWA Readiness (Google Play)

PharmEx is a PWA; Play Store distribution requires a **Trusted Web Activity** wrapper.

### Prerequisites

| Requirement | Status |
|-------------|--------|
| PWA served over HTTPS | ⬜ Production URL |
| Valid `manifest.webmanifest` | ✅ |
| `display: standalone` | ✅ |
| Digital Asset Links (`assetlinks.json`) | ❌ |
| Privacy policy URL | ❌ |
| Target API level 34+ (Android 14) | ⬜ TWA project setting |

### Build steps (when ready)

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://<production-domain>/manifest.webmanifest
bubblewrap build
# Upload app-release-bundle.aab to Play Console internal testing
```

### `assetlinks.json`

Host at `https://<domain>/.well-known/assetlinks.json` with SHA-256 cert fingerprint from TWA signing key.

### Play Console checklist

- [ ] Developer account created
- [ ] App created (package name e.g. `bd.pharmex.app`)
- [ ] Data safety form completed (matches Privacy Policy)
- [ ] Content rating questionnaire
- [ ] Target audience (business / medical)
- [ ] Internal testing track → closed → production rollout
- [ ] Permissions review (notifications only at runtime)

See also: [play-store-checklist.md](./play-store-checklist.md)

---

## 6. Store Readiness Score

| Category | Weight | Score |
|----------|--------|-------|
| Legal (Privacy + Terms) | 40% | 0/40 |
| PWA technical | 25% | 22/25 |
| Visual assets | 20% | 12/20 |
| TWA / Play Console | 15% | 0/15 |
| **Total** | | **34/100** |

---

## Blocking Store Issues

| ID | Issue |
|----|-------|
| STORE-01 | Privacy Policy URL not published |
| STORE-02 | Terms & Conditions URL not published |
| STORE-03 | Play Store screenshots not created |
| STORE-04 | TWA not built; `assetlinks.json` missing |
| STORE-05 | Data safety form not completed |
