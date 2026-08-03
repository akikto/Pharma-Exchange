# Implementation Roadmap

**PRD source:** `docs/master-feature-specification.md`  
**Gap analysis:** `docs/feature-gap-report.md`  
**Baseline:** `main` branch  
**Created:** 2026-08-03

---

## Principles

1. **One phase per PR** — never implement multiple categories in a single pull request.
2. **Reuse existing stack** — React PWA, Node.js API, PostgreSQL/Prisma, Socket.IO, Firebase (Auth/FCM/Storage only).
3. **No breaking changes** — preserve all current routes, APIs, and user flows.
4. **Platform adaptation** — map Android-specific PRD items to web equivalents (see mapping table below).
5. **Build → lint → test → commit → push → verify Vercel** after each phase.

---

## Platform Adaptation Table

| PRD (Android) | Web Implementation |
|---------------|-------------------|
| Room SQLite | PostgreSQL API + TanStack Query cache; optional IndexedDB for offline drafts |
| Firestore sync | REST API as source of truth (skip Firestore dual-write unless required) |
| FileProvider CSV share | `Blob` download + Web Share API |
| Compose test tags | `data-testid` attributes + Playwright/Vitest |
| Android notification channels | Web Push categories via service worker |
| Material 3 components | Extend existing Tailwind design tokens in `index.css` |
| Bottom sheet | Radix Dialog/Sheet or Vaul drawer component |
| Snackbar | Radix Toast provider (already in dependencies) |

---

## Phase Overview

| Phase | Name | Features to Deliver | Est. New Backend | Est. New Frontend | Depends On |
|-------|------|--------------------|--------------------|-------------------|------------|
| **1** | Navigation & App Shell | 6 | — | High | — |
| **2** | Marketplace Feed (Home) | 12 | Low | High | Phase 1 |
| **3** | Search & Discovery + Filters | 13 | Medium | High | Phase 2 |
| **4** | Medicine Offers + Comparison | 12 | Medium | High | Phase 3 |
| **5** | Cart & Checkout | 8 | Low | Medium | Phase 4 |
| **6** | Buy Requests & Orders | 14 | Low | High | Phase 5 |
| **7** | Seller Inventory | 17 | Medium | High | Phase 1 |
| **8** | Bulk Procurement | 7 | High | Medium | Phase 2 |
| **9** | Watchlist & Price Alerts | 9 | High | High | Phase 4 |
| **10** | In-App Chat | 8 | Low | Medium | Phase 6 |
| **11** | Shop Profile & Identity | 5 | Low | Medium | Phase 1 |
| **12** | Seller Authentication | 10 | Low | Medium | — |
| **13** | AI Matching (Gemini) | 5 | High | Medium | Phase 2, 9 |
| **14** | Cloud Sync | 7 | — | Low | **Skip Firestore; API sync only** |
| **15** | Push Notifications (FCM) | 7 | Low | Medium | Phase 1 |
| **16** | Local Data & Persistence | 10 | Medium | Medium | Phase 9 |
| **17** | Utilities & Platform | 7 | Low | Low | All |

---

## Phase 1 — Navigation & App Shell

**Goal:** Align app shell with PRD navigation patterns and global UX primitives.

### Scope

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 1.1 | Five-tab bottom navigation | Align buyer tabs to Feed (Home), Cart, Inventory (seller mode swap), Chat, Profile. Keep seller sub-nav for Inventory/Requests. Merge PR #28 nav badges. |
| 1.2 | Bengali/English bilingual UI | Add `react-i18next`; BN-primary labels + EN subtitles on nav, auth, and key CTAs. Persist locale in user settings API. |
| 1.3 | Material 3 theme | Audit tokens against PRD palette; edge-to-edge layout with safe areas; consistent elevation. |
| 1.4 | Snackbar feedback | Wire Radix Toast provider in `providers.tsx`; `useToast()` hook; success/error on cart, auth, listing actions. |
| 1.5 | Persistent request bottom sheet | Collapsible sheet showing cart item count + pending buy request count; accessible from all tabs. |
| 1.6 | Modal overlays | Dialog components for buy-request, add/edit offer (quick edit), search (mobile). Defer watchlist/comparison/bulk to Phases 4/8/9. |

### Deliverables

- [ ] Updated `nav-config.ts` matching PRD tab structure
- [ ] `i18n/` locale files (`bn.json`, `en.json`)
- [ ] `ToastProvider` + `useToast` hook
- [ ] `RequestBottomSheet` component
- [ ] `Dialog` UI primitives (shadcn-style)
- [ ] Unit tests for nav config and i18n keys
- [ ] `docs/phase1-navigation-report.md` updated

### Out of Scope

- Watchlist modal (Phase 9)
- Multi-seller comparison modal (Phase 4)
- Bulk request modal (Phase 8)

### Merge Note

Incorporate unmerged work from PR #28 (nav badges, side rail, admin layout, notification deep links) as part of Phase 1.

---

## Phase 2 — Marketplace Feed (Home)

**Goal:** Complete home feed experience per PRD.

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 2.1–2.2 | Live feed + grid | Already done; polish loading states |
| 2.3 | Catalog comparison view | Group listings by `medicineId`; summary cards with seller count + best price |
| 2.4 | Pull-to-refresh | Touch pull gesture + manual refresh button; invalidate listings query |
| 2.5 | Shop header | Show buyer's pharmacy (if seller) or featured shop; verified badge, city |
| 2.6 | Inline search bar | Result count badge; clear filters button |
| 2.7 | Dedicated search screen | Already done |
| 2.8 | Barcode scan button | UI placeholder button (disabled, "Coming soon" tooltip) |
| 2.9 | Watchlist shortcut | Header heart icon with count (stub until Phase 9) |
| 2.10 | Cart shortcut | Header cart icon with badge |
| 2.11 | Notifications icon | Bell with unread badge in home TopBar |
| 2.12 | Bulk procurement banner | Dismissible CTA banner linking to bulk dialog (stub until Phase 8) |

---

## Phase 3 — Search & Discovery + Filtering & Sorting

**Goal:** Full search experience with all filter dimensions.

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 3.1 | Predictive autocomplete | Debounced `/medicines?q=` typeahead on search page |
| 3.2 | Recent searches | `localStorage` history; clear-all |
| 3.3–3.4 | Category + dosage filters | Chip UI wired to `category` and `dosageForm` query params |
| 3.5 | Generic alternatives | `/medicines/:id/alternatives` endpoint or client-side generic name match |
| 3.6 | Voice search simulation | Mic button injects demo query string |
| 3.7 | Search result actions | Inline add-to-cart, watchlist toggle, compare buttons on cards |
| 3.8 | Quick filters | Wire home chips: nearby, short expiry, 50%+ discount, overstock |
| 3.9 | Drug category chips | Reuse dosage form chips on search |
| 3.10 | Marketplace sort | Add rating, distance, recommended; asc/desc toggle |
| 3.11 | Advanced filters | Bottom sheet: max price, min rating, max distance, verified-only, in-stock |
| 3.12–3.13 | Filter reset + indicators | "Clear all" button; badge count on filter icon |

**Backend:** Implement geo/radius filter in `listing.service.ts` (currently validated but not applied).

---

## Phase 4 — Medicine Offer Display + Multi-Seller Comparison

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 4.1–4.2 | Offer cards | Add verified badge, direct buy CTA |
| 4.3 | Watchlist toggle | Heart button (requires Phase 9 API or stub) |
| 4.4 | Price trend dialog | Simulated 30-day chart with mock data |
| 4.5 | Quick contact | `tel:` and WhatsApp links from pharmacy phone |
| 4.6 | Direct buy request | Primary "Buy Now" opens buy-request dialog |
| 4.7 | Urgency cues | Low-stock color border when qty < threshold |
| 4.8–4.12 | Comparison | `/medicine/:medicineId/compare` route; ranked seller table; sort by price/expiry/distance |

**Backend:** `GET /listings/compare?medicineId=` grouping active listings.

---

## Phase 5 — Cart & Checkout

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 5.3 | Quantity adjust | Wire `useUpdateCartItem` in cart page with MOQ/stock limits |
| 5.5 | Checkout note | Note textarea per seller group on buy request submit |
| 5.7 | Cart in bottom sheet | Integrate with Phase 1 `RequestBottomSheet` |
| 5.8 | Cart total | Add grand total across all sellers |

---

## Phase 6 — Buy Requests & Orders

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 6.1 | Buy request dialog | Reusable modal: qty, note, total, submit/add-to-cart |
| 6.3 | Order history in Cart | Tabbed Cart screen: Cart / Orders / Buy Requests |
| 6.5 | Order search & filters | Status filter chips + search input on order lists |
| 6.6 | Order statistics | Summary cards on buyer orders tab |
| 6.7 | Reorder | "Reorder" button → add all items to cart |
| 6.8–6.9 | Receipt + share | Invoice modal; Web Share API text export |
| 6.11–6.12 | Status steppers | Visual stepper component for request + shipment lifecycle |
| 6.13 | Map tracker | Simulated map UI with ETA (static illustration) |
| 6.14 | Tracking dialog | Modal from order card "Track" button |

---

## Phase 7 — Seller Inventory Management

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 7.2–7.3 | Stat chips + tabs | Active/paused/sold-out/low-stock chips; tabbed inventory view |
| 7.4 | Dashboard search | Filter inventory list by name/generic/batch |
| 7.8–7.10 | Pause/sold-out/delete | Action buttons on inventory rows; wire existing APIs |
| 7.11 | Quick restock | +50 quantity button |
| 7.12–7.13 | Low-stock threshold | New `lowStockThreshold` field on Listing; alert notification |
| 7.14–7.15 | CSV export + share | `GET /listings/inventory/export`; download + Web Share |
| 7.16–7.17 | Auth prompt + status pill | Login banner for guests; signed-in pill on dashboard |

---

## Phase 8 — Bulk Procurement

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 8.1–8.7 | Full bulk flow | New `BulkRequest` Prisma model; form dialog with all fields; compliance toggles; expiry presets; validation; POST creates marketplace listing; FAB on seller dashboard |

---

## Phase 9 — Watchlist & Price Alerts

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 9.1–9.3 | Watchlist | `WatchlistItem` model; CRUD API; `/watchlist` screen; price summary |
| 9.4–9.9 | Price alerts | `PriceAlert` + `TriggeredAlert` models; threshold CRUD; cron/listener on listing insert; alerts inbox; simulate demo action |

---

## Phase 10 — In-App Chat

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 10.2 | Request selector | Dropdown to filter conversations by buy request/order |
| 10.5 | Status updates in chat | Accept/dispatch/deliver buttons for seller in chat header |
| 10.6–10.7 | Quick call + WhatsApp | Header action buttons |
| 10.8 | Auto status messages | Post SYSTEM messages on order status change (backend + render in UI) |

---

## Phase 11 — Shop Profile & Identity

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 11.1 | Full profile | Owner, license, deals count, address, description |
| 11.2 | Multi-shop switching | Demo mode: switch between seed pharmacies (local state) |
| 11.3 | Contact actions | Call + WhatsApp buttons |
| 11.4 | Verified badge | Shield icon component for APPROVED pharmacies |

---

## Phase 12 — Seller Authentication

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 12.3 | Google Sign-In | Firebase Google provider button on login |
| 12.4 | Guest/demo login | "Try demo" button with read-only seed account |
| 12.7 | Password visibility | Eye toggle on password fields |
| 12.8 | Login/register tabs | Segmented control on single auth screen |
| 12.9 | Account dashboard | Post-login summary card before redirect |

---

## Phase 13 — AI Matching (Gemini)

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 13.1 | Gemini integration | `@google/generative-ai` backend service; `GEMINI_API_KEY` env |
| 13.2 | Rule-based fallback | Local match by generic name + price when API unavailable |
| 13.3–13.5 | Feed cards | AI match section on home; refresh button; add-to-cart action |

---

## Phase 14 — Cloud Sync (Adapted)

**Recommendation: Skip Firestore port.** Deliver API-based sync equivalent.

| PRD ID | Adapted Feature | Work Items |
|--------|----------------|------------|
| 14.6 | Graceful degradation | Already partial; document behavior |
| 14.7 | Auto-sync on startup | `queryClient.prefetchQuery` for listings, cart, orders on app load |
| — | Offline indicator | Banner when network unavailable |
| — | Stale-while-revalidate | Extend TanStack Query `staleTime` for listings |

---

## Phase 15 — Push Notifications (FCM)

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 15.1–15.2 | FCM frontend | `getMessaging()` + `POST /auth/fcm-token` on login |
| 15.3–15.4 | Push handling | Service worker `push` event; parse payload; show notification |
| 15.6 | Permission prompt | `Notification.requestPermission()` after onboarding |
| 15.7 | Tap navigation | `notificationclick` → deep link via `notification-routes.ts` |

---

## Phase 16 — Local Data & Persistence

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 16.1 | Client persistence | IndexedDB via `idb-keyval` for recent searches, draft listings |
| 16.8–16.9 | Watchlist + alerts local cache | Offline read of watchlist/alerts (depends Phase 9) |
| — | Settings persistence | PATCH `/auth/me` for language, theme, notification prefs |

---

## Phase 17 — Utilities & Platform

| PRD ID | Feature | Work Items |
|--------|---------|------------|
| 17.1 | Gemini env | Document `GEMINI_API_KEY` in Vercel env checklist |
| 17.3 | File sharing | CSV download utility (from Phase 7) |
| 17.5 | RTL support | `dir` attribute toggle for Bengali RTL sections |
| 17.7 | Test tags | `data-testid` on nav, cart, listing cards; expand Vitest coverage |
| — | Home top bar scroll collapse | Deferred from Phase 1 |
| — | Accessibility audit | Focus rings, reduce-motion, 200% text scale |

---

## Suggested Execution Order

```
Phase 1  → Navigation & App Shell          ← START HERE (awaiting approval)
Phase 2  → Marketplace Feed
Phase 3  → Search & Discovery + Filters
Phase 4  → Offers + Comparison
Phase 5  → Cart & Checkout
Phase 6  → Buy Requests & Orders
Phase 7  → Seller Inventory        (can parallel after Phase 1)
Phase 8  → Bulk Procurement
Phase 9  → Watchlist & Alerts
Phase 10 → In-App Chat             (after Phase 6)
Phase 11 → Shop Profile            (can parallel after Phase 1)
Phase 12 → Seller Auth             (can parallel anytime)
Phase 13 → AI Matching             (after Phases 2 + 9)
Phase 14 → Cloud Sync (adapted)    (lightweight, anytime)
Phase 15 → Push Notifications      (after Phase 1)
Phase 16 → Local Persistence       (after Phase 9)
Phase 17 → Utilities & Platform    (final polish)
```

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| PRD assumes Android; team expects web | Platform adaptation table above; document in every phase report |
| Firestore sync in PRD conflicts with PostgreSQL architecture | Phase 14 explicitly skips Firestore; use REST API |
| Phase 1 scope creep (6 features) | Split modals: only buy-request + offer dialogs in Phase 1; defer watchlist/comparison/bulk |
| Geo search backend gap | Fix `listing.service.ts` in Phase 3 before "near me" filter |
| Gemini API cost/latency | Rule-based fallback required (Phase 13) |
| PR #28 merge conflicts | Rebase Phase 1 branch onto main before starting |

---

## Approval Checklist

Before starting Phase 1 implementation, confirm:

- [ ] PRD saved as `docs/master-feature-specification.md`
- [ ] Gap report reviewed (`docs/feature-gap-report.md`)
- [ ] Roadmap phases approved (`docs/implementation-roadmap.md`)
- [ ] Firestore skip for Phase 14 accepted
- [ ] Platform adaptation approach accepted (web/PWA, not Android port)

**Status:** Awaiting approval. No code changes until confirmed.

---

## Document History

| Date | Change |
|------|--------|
| 2026-08-03 | Initial roadmap from Master Feature Specification v1.0 |
