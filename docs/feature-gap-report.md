# Feature Gap Report

**Baseline:** `main` branch (2026-08-03)  
**PRD source:** `docs/master-feature-specification.md`  
**Stack:** React 19 PWA + Node.js/Express + PostgreSQL/Prisma + Socket.IO

> **Platform mapping:** The PRD targets an Android native app (Room, Compose, Firestore). This codebase is a web PWA with a REST API and PostgreSQL. Features are scored by **user-visible behavior**, with platform-specific items mapped to web equivalents (e.g., Room → server persistence + client cache; FileProvider → Web Share API / download).

> **Unmerged work:** Branch `cursor/phase1-navigation-shell-239a` (PR #28) adds nav badges, desktop side rail, admin left rail, and notification deep links. Those improvements are noted inline but are **not** on `main` yet.

---

## Summary

| Phase | Total Features | ✅ Implemented | 🟡 Partial | ❌ Missing | ⚠ Needs Improvement |
|-------|---------------|----------------|------------|------------|---------------------|
| 1 — Navigation & App Shell | 6 | 1 | 3 | 2 | 0 |
| 2 — Marketplace Feed | 12 | 4 | 3 | 5 | 0 |
| 3 — Search, Discovery & Filters | 13 | 0 | 4 | 9 | 0 |
| 4 — Offers & Comparison | 12 | 3 | 3 | 6 | 0 |
| 5 — Cart & Checkout | 8 | 5 | 1 | 2 | 0 |
| 6 — Buy Requests & Orders | 14 | 3 | 5 | 6 | 0 |
| 7 — Seller Inventory | 17 | 4 | 4 | 9 | 0 |
| 8 — Bulk Procurement | 7 | 0 | 0 | 7 | 0 |
| 9 — Watchlist & Alerts | 9 | 0 | 0 | 9 | 0 |
| 10 — In-App Chat | 8 | 3 | 1 | 4 | 0 |
| 11 — Shop Profile | 5 | 1 | 2 | 2 | 0 |
| 12 — Seller Authentication | 10 | 5 | 3 | 2 | 0 |
| 13 — AI Matching | 5 | 0 | 0 | 5 | 0 |
| 14 — Cloud Sync | 7 | 0 | 2 | 5 | 0 |
| 15 — Push Notifications | 7 | 1 | 2 | 4 | 0 |
| 16 — Local Data & Persistence | 10 | 6 | 2 | 2 | 0 |
| 17 — Utilities & Platform | 7 | 2 | 1 | 2 | 2 |
| **TOTAL** | **147** | **38 (26%)** | **33 (22%)** | **74 (50%)** | **2 (1%)** |

---

## Phase 1 — Navigation & App Shell

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 1.1 | Five-tab bottom navigation (Feed, Cart, Inventory, Chat, Profile) | 🟡 Partial | Bottom nav exists (`bottom-nav.tsx`) but tabs differ: **buyer** = Home, Search, Cart, Chat, Profile; **seller** = Dashboard, Inventory, Requests, Chat, Profile. No single unified 5-tab layout matching PRD (Feed/Inventory swap by role). |
| 1.2 | Bengali/English bilingual UI | 🟡 Partial | Noto Sans Bengali font loaded (`index.css`); Bengali copy on login errors and forgot-password; language `<select>` on settings (`profile-page.tsx`) — **no i18n framework**, labels mostly English, language choice not persisted or applied. |
| 1.3 | PharmaBazaar Material 3 theme | 🟡 Partial | Custom design tokens in `index.css` (primary teal, surfaces, radii, dark mode). Good foundation but not Material 3 components; no edge-to-edge Android-style insets beyond `safe-bottom`. |
| 1.4 | Snackbar feedback | ❌ Missing | `@radix-ui/react-toast` in `package.json` but no Toast provider or usage anywhere in `src/`. Errors shown inline only. |
| 1.5 | Persistent request bottom sheet | ❌ Missing | No bottom sheet component; cart/requests accessed via full routes only. |
| 1.6 | Modal overlays (auth, watchlist, search, comparison, buy-request, offer, bulk) | 🟡 Partial | Auth uses full-page routes (`/login`, `/register`). No modal dialogs for watchlist, comparison, buy-request, bulk, or offer editing. `@radix-ui/react-dialog` installed but unused. |

**Phase 1 score:** 0 ✅ · 4 🟡 · 2 ❌

---

## Phase 2 — Marketplace Feed (Home)

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 2.1 | Live offers feed | ✅ Implemented | `home-page.tsx` — infinite scroll via `useListings` + `IntersectionObserver`. |
| 2.2 | Grid view | ✅ Implemented | 2-column grid of `ListingCard` components. |
| 2.3 | Catalog comparison view | ❌ Missing | No medicine-grouped catalog; listings shown individually only. |
| 2.4 | Pull-to-refresh | ❌ Missing | No pull-to-refresh gesture or manual refresh control on home. |
| 2.5 | Shop header | ❌ Missing | No active pharmacy header with verified badge, location, or "Made in India" badge on feed. |
| 2.6 | Inline search bar | 🟡 Partial | Search bar links to `/search` but shows no result count or filter reset on home. |
| 2.7 | Dedicated search screen | ✅ Implemented | `/search` route with query params and filters (`search-page.tsx`). |
| 2.8 | Barcode scan button | ❌ Missing | No barcode UI on home or search. |
| 2.9 | Watchlist shortcut | ❌ Missing | No watchlist feature or header button. |
| 2.10 | Cart shortcut | 🟡 Partial | Cart in bottom nav with badge (PR #28); no dedicated header cart button on home. |
| 2.11 | Notifications icon | 🟡 Partial | TopBar has bell on some screens; links to `/notifications` (exists). PR #28 adds unread badge. PRD originally said "placeholder" — **screen exists**, scoring as partial until header placement on feed is complete. |
| 2.12 | Bulk procurement banner | ❌ Missing | No bulk CTA on home feed. |

**Phase 2 score:** 3 ✅ · 3 🟡 · 6 ❌

---

## Phase 3 — Search & Discovery + Filtering & Sorting

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 3.1 | Predictive autocomplete | 🟡 Partial | Medicine autocomplete on **seller** listing form (`listing-form-page.tsx`); not on buyer search. |
| 3.2 | Recent searches | ❌ Missing | No localStorage or API for search history. |
| 3.3 | Therapeutic category filters | ❌ Missing | `category` param read in search but no UI chips (gastric, pain, antibiotic, etc.). |
| 3.4 | Dosage form filters | ❌ Missing | `DosageForm` enum in Prisma; no frontend filter UI. |
| 3.5 | Generic alternatives discovery | ❌ Missing | No substitute/cheaper-generic suggestions. |
| 3.6 | Voice search simulation | ❌ Missing | Mic icon on chat only (no handler); not on search. |
| 3.7 | Search result actions | 🟡 Partial | Cards link to detail (add to cart from there); no inline watchlist or compare from results. |
| 3.8 | Quick filters (near me, short expiry, 50%+ discount, overstock) | 🟡 Partial | Home shows chips `All/Nearby/New/Discounted` but **no onClick handlers** (`home-page.tsx`). |
| 3.9 | Drug category chips | ❌ Missing | Not exposed in search UI. |
| 3.10 | Marketplace sort | 🟡 Partial | Sort by newest/price/expiry/discount on search; missing recommended, rating, distance. |
| 3.11 | Advanced marketplace filters | 🟡 Partial | Backend supports price range, composition, company, expiry months, geo radius (`listing.validation.ts`); frontend only exposes city + min discount. Geo filters **validated but not applied** in `listing.service.ts`. |
| 3.12 | Filter reset | ❌ Missing | No "clear all filters" action. |
| 3.13 | Active filter indicators | ❌ Missing | No badge count on filter icon. |

**Phase 3 score:** 0 ✅ · 5 🟡 · 8 ❌

---

## Phase 4 — Medicine Offer Display + Multi-Seller Comparison

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 4.1 | Offer cards (list) | ✅ Implemented | `listing-card.tsx` — name, price, discount, expiry, MOQ, seller rating. MRP shown as strikethrough selling price. |
| 4.2 | Offer grid cards | ✅ Implemented | 2-column grid layout with quick navigation to detail. |
| 4.3 | Watchlist toggle on offers | ❌ Missing | No heart/favorite button on cards or detail. |
| 4.4 | Price trend dialog | ❌ Missing | No historical price chart. |
| 4.5 | Quick contact actions | 🟡 Partial | In-app chat from detail page; no phone (`tel:`) or WhatsApp links. |
| 4.6 | Direct buy request | 🟡 Partial | "Add to Cart" primary CTA; no one-tap "Buy Request" dialog on card. |
| 4.7 | Low-stock / expiry visual cues | ✅ Implemented | `StatusChip` with expiry color variants (`getExpiryStatus` in `utils.ts`). Low-stock urgency not color-coded separately. |
| 4.8 | Comparison screen | ❌ Missing | No `/compare` route or per-medicine multi-seller view. |
| 4.9 | Comparison sorting | ❌ Missing | — |
| 4.10 | Price comparison component | ❌ Missing | — |
| 4.11 | Buy/chat from comparison | ❌ Missing | — |
| 4.12 | Catalog-level comparison cards | ❌ Missing | — |

**Phase 4 score:** 3 ✅ · 2 🟡 · 7 ❌

---

## Phase 5 — Cart & Checkout

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 5.1 | Multi-vendor cart | ✅ Implemented | `GET /cart` returns items from multiple sellers. |
| 5.2 | Seller-grouped cart display | ✅ Implemented | `cart-page.tsx` groups by `groupedBySeller`. |
| 5.3 | Quantity adjust | 🟡 Partial | Quantity stepper on medicine detail; **no in-cart quantity edit** (`useUpdateCartItem` hook exists but unused). |
| 5.4 | Remove cart items | ✅ Implemented | Trash button per line → `DELETE /cart/:id`. |
| 5.5 | Checkout note | ❌ Missing | Buy request POST sends no `note` field from cart UI (backend supports `note` on buy requests). |
| 5.6 | Multi-vendor checkout | ✅ Implemented | "Send Buy Request" per seller group → `POST /buy-requests`. |
| 5.7 | Cart tab in bottom sheet | ❌ Missing | Cart is a full route, not a persistent bottom sheet tab. |
| 5.8 | Cart total calculation | ✅ Implemented | Per-seller subtotals displayed. |

**Phase 5 score:** 5 ✅ · 1 🟡 · 2 ❌

---

## Phase 6 — Buy Requests & Orders

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 6.1 | Direct buy request dialog | 🟡 Partial | Buy request flow via cart; no modal with quantity/note/total on offer card. |
| 6.2 | Buy request statuses | ✅ Implemented | PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED in schema; displayed via `StatusChip`. |
| 6.3 | Order history (buyer) | 🟡 Partial | `/orders` page exists; **not a tab inside Cart screen** as PRD specifies. |
| 6.4 | Order history (supplier) | ✅ Implemented | `/seller/orders` with shared `OrdersPage` component. |
| 6.5 | Order search & status filters | ❌ Missing | List pages show all orders; no search or status filter UI. |
| 6.6 | Order statistics | 🟡 Partial | Seller analytics has sales/pending counts; no buyer order stats or completed volume summary on cart. |
| 6.7 | Reorder | ❌ Missing | No "reorder" action on past orders. |
| 6.8 | Order receipt modal | ❌ Missing | Order detail shows items/history; no invoice-style receipt modal. |
| 6.9 | Share receipt | ❌ Missing | No Web Share API integration for receipts. |
| 6.10 | Firestore order refresh | ❌ Missing | Orders fetched from PostgreSQL API (`GET /orders`); no Firestore sync. **Web equivalent:** API sync exists; Firestore-specific feature N/A unless dual-write required. |
| 6.11 | Request status tracker | 🟡 Partial | Status chips and history list; no visual stepper component. |
| 6.12 | Shipment status stepper | 🟡 Partial | Seller can advance CONFIRMED→PACKED→SHIPPED→DELIVERED (`order-detail-page.tsx`); no buyer-facing stepper UI; no "in transit" step. |
| 6.13 | Shipment map tracker | ❌ Missing | No map/ETA/courier simulation UI. |
| 6.14 | Order details tracking dialog | ❌ Missing | Tracking is inline on detail page, not a modal. |

**Phase 6 score:** 2 ✅ · 5 🟡 · 7 ❌

---

## Phase 7 — Seller Inventory Management

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 7.1 | Seller dashboard | ✅ Implemented | `seller-dashboard-page.tsx` — KPIs, pending requests, quick links. |
| 7.2 | Inventory stat chips | 🟡 Partial | Analytics cards show active listings count; no paused/sold-out/low-stock chips. |
| 7.3 | Inventory status tabs | ❌ Missing | Single flat inventory list; no tabbed filters by status. |
| 7.4 | Dashboard search | ❌ Missing | No search within inventory list. |
| 7.5 | Add new listing | ✅ Implemented | FAB/button → `/seller/listing/new`. |
| 7.6 | Edit listing | ✅ Implemented | `/seller/listing/:id` form. |
| 7.7 | Master medicine picker | ✅ Implemented | Autocomplete search against `/medicines?q=`. |
| 7.8 | Pause / resume listing | 🟡 Partial | API: `POST /listings/:id/pause` and `/activate`; **no UI buttons**. |
| 7.9 | Mark sold out | 🟡 Partial | Status can be set via edit form; no quick "sold out" action. |
| 7.10 | Delete listing | ❌ Missing | API: `DELETE /listings/:id`; no UI. |
| 7.11 | Quick restock (+50) | ❌ Missing | API: `PATCH /listings/:id/quantity`; no +50 quick action. |
| 7.12 | Low-stock threshold config | ❌ Missing | No per-listing threshold field or dialog. |
| 7.13 | Low-stock local notifications | ❌ Missing | Backend cron alerts sellers on short expiry; no low-stock threshold alerts. |
| 7.14 | Inventory CSV export | ❌ Missing | No export endpoint or UI. |
| 7.15 | CSV share | ❌ Missing | No FileProvider/Web Share for CSV. |
| 7.16 | Supplier auth prompt | 🟡 Partial | `SellerRoute` redirects unverified users; no inline login banner on dashboard. |
| 7.17 | Auth status pill | ❌ Missing | No signed-in status indicator on seller dashboard. |

**Phase 7 score:** 4 ✅ · 4 🟡 · 9 ❌

---

## Phase 8 — Bulk Procurement

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 8.1 | Bulk medicine request dialog | ❌ Missing | No bulk procurement UI. |
| 8.2 | Bulk request fields | ❌ Missing | — |
| 8.3 | Compliance toggles | ❌ Missing | — |
| 8.4 | Expiry presets | ❌ Missing | — |
| 8.5 | Form validation | ❌ Missing | — |
| 8.6 | Bulk request posting | ❌ Missing | No backend module for bulk requests. |
| 8.7 | Bulk request FAB | ❌ Missing | — |

**Phase 8 score:** 0 ✅ · 0 🟡 · 7 ❌

---

## Phase 9 — Watchlist & Price Alerts

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 9.1 | Medicine watchlist | ❌ Missing | No Prisma model, API, or UI. |
| 9.2 | Watchlist screen | ❌ Missing | — |
| 9.3 | Watchlist price summary | ❌ Missing | — |
| 9.4 | Price threshold alerts | ❌ Missing | — |
| 9.5 | Enable/disable thresholds | ❌ Missing | — |
| 9.6 | Auto-triggered alerts | ❌ Missing | — |
| 9.7 | Triggered alerts inbox | ❌ Missing | — |
| 9.8 | Add to cart from alert | ❌ Missing | — |
| 9.9 | Simulate low-price offer | ❌ Missing | — |

**Phase 9 score:** 0 ✅ · 0 🟡 · 9 ❌

---

## Phase 10 — In-App Chat

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 10.1 | Chat tab | ✅ Implemented | `/chat` in bottom nav; Socket.IO real-time messaging. |
| 10.2 | Request selector | ❌ Missing | Conversations not scoped to buy-request picker UI. |
| 10.3 | Message thread | ✅ Implemented | `ChatPage` with history + real-time updates. |
| 10.4 | Send messages | ✅ Implemented | Text send via REST + socket broadcast. |
| 10.5 | Status updates from chat | ❌ Missing | No accept/dispatch/deliver buttons in chat context. |
| 10.6 | Quick call | ❌ Missing | No `tel:` link in chat header. |
| 10.7 | Quick WhatsApp | ❌ Missing | No WhatsApp deep link. |
| 10.8 | Auto status messages | 🟡 Partial | `MessageType.SYSTEM` in schema; not visibly surfaced in chat UI on status changes. |

**Phase 10 score:** 3 ✅ · 1 🟡 · 4 ❌

---

## Phase 11 — Shop Profile & Identity

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 11.1 | Shop profile screen | 🟡 Partial | `PharmacyProfilePage` shows name, rating, city, listings — missing owner, license, deals completed, full address. |
| 11.2 | Multi-shop switching | ❌ Missing | One pharmacy per user; no persona switching. |
| 11.3 | Profile contact actions | ❌ Missing | No call/WhatsApp on profile. |
| 11.4 | Verified shop badge | 🟡 Partial | `verificationStatus` shown as text on user profile; no shield badge on pharmacy profile. |
| 11.5 | Seller auth entry | ✅ Implemented | Login/register routes; pharmacy registration flow. |

**Phase 11 score:** 1 ✅ · 2 🟡 · 2 ❌

---

## Phase 12 — Seller Authentication

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 12.1 | Email/password login | ✅ Implemented | `POST /auth/login` with JWT; not Firebase-primary but functionally equivalent. |
| 12.2 | Pharmacy seller registration | ✅ Implemented | User register + `POST /pharmacies/register`. |
| 12.3 | Google Sign-In | ❌ Missing | `loginWithFirebase` in auth store; `POST /auth/firebase` on backend; **no Google button in UI**. |
| 12.4 | Guest/demo login | ❌ Missing | No offline demo auth path. |
| 12.5 | Sign out | ✅ Implemented | Logout clears tokens. |
| 12.6 | Auth error handling | ✅ Implemented | Bengali/English error messages on login; rate limit handling. |
| 12.7 | Password visibility toggle | ❌ Missing | Password fields always `type="password"`. |
| 12.8 | Login/register tabs | 🟡 Partial | Email/phone toggle on login; register is separate route (not segmented tabs on one screen). |
| 12.9 | Authenticated account dashboard | ❌ Missing | No post-login summary on auth screen. |
| 12.10 | Firebase session restore | 🟡 Partial | JWT refresh token auto-restore (`api.ts`); Firebase session not used in UI. |

**Phase 12 score:** 4 ✅ · 2 🟡 · 4 ❌

---

## Phase 13 — AI Matching (Gemini)

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 13.1 | Gemini AI match suggestions | ❌ Missing | No Gemini SDK, env var, or API module. |
| 13.2 | Rule-based AI fallback | ❌ Missing | — |
| 13.3 | AI match cards on feed | ❌ Missing | — |
| 13.4 | Refresh AI suggestions | ❌ Missing | — |
| 13.5 | Add to cart from AI match | ❌ Missing | — |

**Phase 13 score:** 0 ✅ · 0 🟡 · 5 ❌

---

## Phase 14 — Cloud Sync (Firebase)

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 14.1 | Firestore inventory sync | ❌ Missing | PostgreSQL is source of truth; no Firestore writes. |
| 14.2 | Firestore request sync | ❌ Missing | — |
| 14.3 | Firestore order fetch | ❌ Missing | — |
| 14.4 | Firestore product fetch | ❌ Missing | — |
| 14.5 | Real-time Firestore observers | ❌ Missing | Real-time via Socket.IO for chat only. |
| 14.6 | Graceful Firebase degradation | 🟡 Partial | `isFirebaseConfigured()` guard; app works without Firebase env vars. |
| 14.7 | Auto-sync on startup | 🟡 Partial | TanStack Query fetches on mount; `prisma/seed.ts` populates demo data. No Firestore sync. |

**Phase 14 score:** 0 ✅ · 2 🟡 · 5 ❌

> **Recommendation:** For this web stack, implement cloud sync as **REST API + TanStack Query cache invalidation** rather than duplicating Firestore. Mark Firestore-specific items as "N/A — replaced by PostgreSQL API" unless dual-platform sync is required.

---

## Phase 15 — Push Notifications (FCM)

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 15.1 | FCM service | 🟡 Partial | Backend `notification.service.ts` sends FCM via Firebase Admin; frontend does not register for push. |
| 15.2 | FCM token retrieval | ❌ Missing | Backend `POST /auth/fcm-token` exists; frontend never calls it. |
| 15.3 | Order status notifications | 🟡 Partial | In-app notifications created on order events; browser push not wired. |
| 15.4 | FCM payload handling | ❌ Missing | No service worker push handler in PWA. |
| 15.5 | Notification channels | ❌ Missing | Android-specific; web equivalent = notification categories (not implemented). |
| 15.6 | Android 13+ permission | ❌ Missing | Web equivalent = `Notification.requestPermission()` (not implemented). |
| 15.7 | Notification tap navigation | ✅ Implemented | `notification-routes.ts` + clickable notifications (PR #28); on `main`, notifications list without deep links. |

**Phase 15 score:** 1 ✅ · 2 🟡 · 4 ❌

---

## Phase 16 — Local Data & Persistence

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 16.1 | Room SQLite database | 🟡 Partial | **Web equivalent:** PostgreSQL (server) + TanStack Query cache + `localStorage` for auth/theme. No offline IndexedDB. |
| 16.2 | Master medicine catalog | ✅ Implemented | `Medicine` model + `GET /medicines`. |
| 16.3 | Offer listings storage | ✅ Implemented | `Listing` model with full schema. |
| 16.4 | Cart persistence | ✅ Implemented | `CartItem` model; server-side cart. |
| 16.5 | Buy requests storage | ✅ Implemented | `BuyRequest` + `BuyRequestItem` models. |
| 16.6 | Chat messages storage | ✅ Implemented | `Message` + `Conversation` models. |
| 16.7 | Shop profiles storage | ✅ Implemented | `Pharmacy` model. |
| 16.8 | Watchlist storage | ❌ Missing | — |
| 16.9 | Price threshold & alert storage | ❌ Missing | — |
| 16.10 | Sample data seeding | ✅ Implemented | `backend/prisma/seed.ts`. |

**Phase 16 score:** 7 ✅ · 1 🟡 · 2 ❌

---

## Phase 17 — Utilities & Platform

| ID | Feature | Status | Evidence / Gap |
|----|---------|--------|----------------|
| 17.1 | Secrets/env config | ✅ Implemented | `VITE_*` frontend env, backend `env.ts` validation. Gemini key not yet used. |
| 17.2 | Debug/release signing | N/A | Web deployment via Vercel; no APK signing. |
| 17.3 | FileProvider | ❌ Missing | **Web equivalent:** download/share for CSV — not implemented. |
| 17.4 | Internet permission | N/A | Implicit for web/PWA. |
| 17.5 | RTL support | ❌ Missing | No `dir="rtl"` or RTL layout rules. |
| 17.6 | App backup rules | N/A | Android-specific. |
| 17.7 | Test tags | ⚠ Needs Improvement | Some `aria-label` attributes; no systematic `data-testid` on nav/actions. Vitest covers 5 utility files only. |

**Phase 17 score:** 1 ✅ · 0 🟡 · 2 ❌ · 2 N/A/⚠

---

## Critical Architecture Gaps

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No watchlist or price alerts (Phase 9) | High — entire feature area missing | New Prisma models + API + UI |
| No multi-seller comparison (Phase 4) | High — core marketplace differentiator | Group listings by `medicineId`; new compare route |
| No bulk procurement (Phase 8) | Medium | New `BulkRequest` model + dialog |
| No Gemini AI matching (Phase 13) | Medium | New backend service + feed cards |
| Firestore sync (Phase 14) vs PostgreSQL | Low for web | **Do not port Firestore**; use existing REST API |
| FCM frontend not wired (Phase 15) | Medium | Register token + SW push handler |
| Snackbars + bottom sheet (Phase 1) | Medium — UX polish | Add Toast provider + bottom sheet component |
| Geo/radius search validated but not applied | Medium | Implement in `listing.service.ts` |
| i18n bilingual UI (Phase 1) | Medium | Add `react-i18next` with BN/EN bundles |

---

## Backend vs Frontend Coverage

| Area | Backend | Frontend |
|------|---------|----------|
| Auth (JWT, OTP, Firebase endpoint) | ✅ | 🟡 (no Google UI) |
| Listings CRUD + search | ✅ | 🟡 (subset of filters) |
| Cart + buy requests + orders | ✅ | 🟡 (missing notes, reorder, receipt) |
| Chat (REST + Socket.IO) | ✅ | 🟡 (text only) |
| Notifications (in-app + FCM send) | ✅ | 🟡 (in-app only) |
| Watchlist + price alerts | ❌ | ❌ |
| Bulk procurement | ❌ | ❌ |
| AI / Gemini | ❌ | ❌ |
| Reviews API | ✅ | ❌ (not consumed) |

---

## Document History

| Date | Change |
|------|--------|
| 2026-08-03 | Initial gap report against Master Feature Specification v1.0 |
