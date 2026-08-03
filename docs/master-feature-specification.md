# Master Feature Specification (PRD)

**Document status:** Official Product Requirements Document  
**Product name (PRD):** PharmaBazaar  
**Codebase:** MedLink B2B / Pharma-Exchange (React PWA + Node.js API)  
**Last updated:** 2026-08-03  
**Version:** 1.0

> This document is the **single source of truth** for product features. All implementation, gap analysis, and roadmap work must reference this file.

---

## Platform Note

The original PRD describes an Android native application (Kotlin, Room, Compose, Gradle, FileProvider). The production codebase is a **React 19 PWA** with a **Node.js + PostgreSQL** backend. Features in this spec are evaluated by **functional intent**; platform-specific items (Room, FileProvider, Android notification channels, Compose test tags) map to web/PWA equivalents during implementation.

---

## Phase 1 — Navigation & App Shell

| # | Feature | Description |
|---|---------|-------------|
| 1.1 | Five-tab bottom navigation | Feed, Cart, Inventory, Chat, and Profile |
| 1.2 | Bengali/English bilingual UI | Bengali-primary labels with English subtitles in key areas |
| 1.3 | PharmaBazaar Material 3 theme | Custom colors, typography, and edge-to-edge layout |
| 1.4 | Snackbar feedback | Global success/error toasts for user actions |
| 1.5 | Persistent request bottom sheet | Collapsible cart + pending-request summary bar across tabs |
| 1.6 | Modal overlays | Auth, watchlist, search, multi-seller comparison, buy-request, add/edit offer, and bulk-request dialogs |

---

## Phase 2 — Marketplace Feed (Home)

| # | Feature | Description |
|---|---------|-------------|
| 2.1 | Live offers feed | Scrollable list of active medicine listings |
| 2.2 | Grid view | Compact card layout for offers |
| 2.3 | Catalog comparison view | Medicines grouped by name with multi-seller summary cards |
| 2.4 | Pull-to-refresh | Refreshes price lists and AI match suggestions |
| 2.5 | Shop header | Active pharmacy name, verified badge, location, and "Made in India" badge |
| 2.6 | Inline search bar | Text search with result count and filter reset |
| 2.7 | Dedicated search screen | Full-screen search entry from feed |
| 2.8 | Barcode scan button | UI placeholder (no scanner wired) |
| 2.9 | Watchlist shortcut | Header button with badge count |
| 2.10 | Cart shortcut | Header button with item-count badge |
| 2.11 | Notifications icon | Header placeholder (no notifications screen) |
| 2.12 | Bulk procurement banner | CTA to post bulk medicine requests |

---

## Phase 3 — Search & Discovery

| # | Feature | Description |
|---|---------|-------------|
| 3.1 | Predictive autocomplete | Brand, generic, company, and form suggestions while typing |
| 3.2 | Recent searches | Saved history with clear-all |
| 3.3 | Therapeutic category filters | Gastric, pain, antibiotic, cardio, respiratory, vitamin, etc. |
| 3.4 | Dosage form filters | Tablet, capsule, syrup, injection, chewable |
| 3.5 | Generic alternatives discovery | Shows cheaper/generic substitutes for searched medicines |
| 3.6 | Voice search simulation | Mic button with demo query injection (not real speech recognition) |
| 3.7 | Search result actions | Add to cart, watchlist toggle, and open comparison from results |

---

## Phase 3 (cont.) — Filtering & Sorting

| # | Feature | Description |
|---|---------|-------------|
| 3.8 | Quick filters | All, near me (≤2 km), short expiry (≤30 days), 50%+ discount, overstock (≥50 boxes) |
| 3.9 | Drug category chips | Filter by tablet, capsule, syrup, injection, chewable |
| 3.10 | Marketplace sort | Recommended, price low/high, supplier rating, distance |
| 3.11 | Advanced marketplace filters | Max price, min rating, max distance, verified-only, in-stock-only |
| 3.12 | Filter reset | Clear all marketplace filters at once |
| 3.13 | Active filter indicators | Count of applied advanced filters |

---

## Phase 4 — Medicine Offer Display

| # | Feature | Description |
|---|---------|-------------|
| 4.1 | Offer cards (list) | Medicine details, MRP, offer price, discount, expiry, MOQ, seller info, verified badge |
| 4.2 | Offer grid cards | Compact marketplace cards with quick actions |
| 4.3 | Watchlist toggle on offers | Heart button per listing |
| 4.4 | Price trend dialog | Historical price chart (simulated data) per medicine |
| 4.5 | Quick contact actions | In-app chat, phone call, and WhatsApp per offer |
| 4.6 | Direct buy request | Primary CTA on each offer card |
| 4.7 | Low-stock / expiry visual cues | Color-coded urgency indicators on cards |

---

## Phase 4 (cont.) — Multi-Seller Price Comparison

| # | Feature | Description |
|---|---------|-------------|
| 4.8 | Comparison screen | Side-by-side offers for one medicine across suppliers |
| 4.9 | Comparison sorting | Lowest price, best expiry, nearest seller |
| 4.10 | Price comparison component | Ranked seller list with savings highlights |
| 4.11 | Buy/chat from comparison | Actions per seller row |
| 4.12 | Catalog-level comparison cards | Entry point from grouped catalog view |

---

## Phase 5 — Cart & Checkout

| # | Feature | Description |
|---|---------|-------------|
| 5.1 | Multi-vendor cart | Items from multiple sellers in one cart |
| 5.2 | Seller-grouped cart display | Items organized by supplier |
| 5.3 | Quantity adjust | Increment/decrement with MOQ and stock limits |
| 5.4 | Remove cart items | Per-line delete |
| 5.5 | Checkout note | Optional message on cart submission |
| 5.6 | Multi-vendor checkout | Creates separate buy requests per seller from cart |
| 5.7 | Cart tab in bottom sheet | Manage cart from persistent sheet |
| 5.8 | Cart total calculation | Running price total across items |

---

## Phase 6 — Buy Requests & Orders

| # | Feature | Description |
|---|---------|-------------|
| 6.1 | Direct buy request dialog | Quantity picker, note, price total, add-to-cart or submit |
| 6.2 | Buy request statuses | Pending, accepted, rejected, dispatched, delivered, completed, cancelled |
| 6.3 | Order history (buyer) | Past orders tab inside Cart screen |
| 6.4 | Order history (supplier) | Dedicated tab in seller dashboard |
| 6.5 | Order search & status filters | Filter by status and search by medicine/buyer/seller |
| 6.6 | Order statistics | Total orders, completed count, volume summary |
| 6.7 | Reorder | Re-add a past order's medicine to cart |
| 6.8 | Order receipt modal | Invoice-style receipt view per order |
| 6.9 | Share receipt | Share order receipt as text via system share sheet |
| 6.10 | Firestore order refresh | Pull cloud order history into local DB |
| 6.11 | Request status tracker | Visual stepper for request lifecycle |
| 6.12 | Shipment status stepper | Extended tracking: confirmed → packed → dispatched → in transit → delivered |
| 6.13 | Shipment map tracker | Simulated map-style delivery tracking UI with ETA and courier info |
| 6.14 | Order details tracking dialog | Full tracking modal from order cards |

---

## Phase 7 — Seller Inventory Management

| # | Feature | Description |
|---|---------|-------------|
| 7.1 | Seller dashboard | Inventory hub with stats and tabs |
| 7.2 | Inventory stat chips | Active, paused, sold-out, and low-stock counts |
| 7.3 | Inventory status tabs | Active, paused, sold out, low stock, incoming requests, order history |
| 7.4 | Dashboard search | Search listings by name, generic, company, or batch |
| 7.5 | Add new listing | FAB to create offers |
| 7.6 | Edit listing | Modify existing offers |
| 7.7 | Master medicine picker | Dropdown to pre-fill from master catalog |
| 7.8 | Pause / resume listing | Toggle offer availability |
| 7.9 | Mark sold out | Set listing to sold-out status |
| 7.10 | Delete listing | Remove offer from inventory |
| 7.11 | Quick restock | Add fixed quantity (+50 boxes) to a listing |
| 7.12 | Low-stock threshold config | Per-offer threshold with edit dialog |
| 7.13 | Low-stock local notifications | Alert when stock falls below threshold |
| 7.14 | Inventory CSV export | Generate UTF-8 CSV with summary stats |
| 7.15 | CSV share | Share exported inventory via FileProvider + system share |
| 7.16 | Supplier auth prompt | Login banner when seller is not authenticated |
| 7.17 | Auth status pill | Shows signed-in state on dashboard |

---

## Phase 8 — Bulk Procurement

| # | Feature | Description |
|---|---------|-------------|
| 8.1 | Bulk medicine request dialog | Full procurement form for pharmacies |
| 8.2 | Bulk request fields | Medicine, quantity, target price, expiry requirements, urgency, delivery address, phone |
| 8.3 | Compliance toggles | Cold chain, VAT invoice, factory-sealed requirements |
| 8.4 | Expiry presets | 3/6/12 months, short expiry OK, or custom days |
| 8.5 | Form validation | Real-time checks on quantity, price, and expiry |
| 8.6 | Bulk request posting | Creates a new marketplace listing from the request |
| 8.7 | Bulk request FAB | Quick access from seller dashboard |

---

## Phase 9 — Watchlist & Price Alerts

| # | Feature | Description |
|---|---------|-------------|
| 9.1 | Medicine watchlist | Save medicines for tracking |
| 9.2 | Watchlist screen | Dedicated list with remove and compare actions |
| 9.3 | Watchlist price summary | Best current offer and trend per watched medicine |
| 9.4 | Price threshold alerts | Set max price per medicine |
| 9.5 | Enable/disable thresholds | Toggle alerts on or off |
| 9.6 | Auto-triggered alerts | Fires when new offers meet threshold (on insert/update) |
| 9.7 | Triggered alerts inbox | List of fired alerts with dismiss |
| 9.8 | Add to cart from alert | Quick purchase from triggered alert |
| 9.9 | Simulate low-price offer | Demo action to test alert triggering |

---

## Phase 10 — In-App Chat

| # | Feature | Description |
|---|---------|-------------|
| 10.1 | Chat tab | Messaging tied to buy requests |
| 10.2 | Request selector | Pick which order to chat about |
| 10.3 | Message thread | Buyer/seller chat history per request |
| 10.4 | Send messages | Text input with send action |
| 10.5 | Status updates from chat | Accept, dispatch, deliver buttons in chat context |
| 10.6 | Quick call | Dial seller/buyer phone from chat header |
| 10.7 | Quick WhatsApp | Open WhatsApp with pre-filled number |
| 10.8 | Auto status messages | System chat messages on order status changes |

---

## Phase 11 — Shop Profile & Identity

| # | Feature | Description |
|---|---------|-------------|
| 11.1 | Shop profile screen | Owner, license, rating, deals completed, address |
| 11.2 | Multi-shop switching | Switch active pharmacy persona (demo shops) |
| 11.3 | Profile contact actions | Call and WhatsApp from profile |
| 11.4 | Verified shop badge | Visual trust indicator |
| 11.5 | Seller auth entry | Open login from profile |

---

## Phase 12 — Seller Authentication

| # | Feature | Description |
|---|---------|-------------|
| 12.1 | Email/password login | Firebase Auth sign-in |
| 12.2 | Pharmacy seller registration | Email, password, shop name, license, phone |
| 12.3 | Google Sign-In | Credential Manager + Google ID integration |
| 12.4 | Guest/demo login | Offline demo authentication path |
| 12.5 | Sign out | Clear seller session |
| 12.6 | Auth error handling | Display and clear error messages |
| 12.7 | Password visibility toggle | Show/hide password fields |
| 12.8 | Login/register tabs | Segmented auth mode switcher |
| 12.9 | Authenticated account dashboard | Post-login account summary in auth screen |
| 12.10 | Firebase session restore | Auto-restore logged-in user on app start |

---

## Phase 13 — AI Matching (Gemini)

| # | Feature | Description |
|---|---------|-------------|
| 13.1 | Gemini AI match suggestions | Match open buy requests to supplier inventory via Gemini API |
| 13.2 | Rule-based AI fallback | Local matching when API key is missing or call fails |
| 13.3 | AI match cards on feed | Display match score, reasons, and recommendation summary |
| 13.4 | Refresh AI suggestions | Manual reload of matches |
| 13.5 | Add to cart from AI match | One-tap add matched offer |

---

## Phase 14 — Cloud Sync (Firebase)

| # | Feature | Description |
|---|---------|-------------|
| 14.1 | Firestore inventory sync | Push local listings to `inventory_listings` |
| 14.2 | Firestore request sync | Push buy requests to `pharmacy_requests` |
| 14.3 | Firestore order fetch | Pull remote order history and merge with local DB |
| 14.4 | Firestore product fetch | Load remote product catalog (ViewModel layer) |
| 14.5 | Real-time Firestore observers | Flow-based listeners for cloud inventory and requests |
| 14.6 | Graceful Firebase degradation | App runs with local seed data if Firebase is unavailable |
| 14.7 | Auto-sync on startup | Seed data + Firestore sync on first launch |

---

## Phase 15 — Push Notifications (FCM)

| # | Feature | Description |
|---|---------|-------------|
| 15.1 | FCM service | Receive remote push messages |
| 15.2 | FCM token retrieval | Log device token on startup |
| 15.3 | Order status notifications | Local notifications for dispatched, delivered, accepted, cancelled |
| 15.4 | FCM payload handling | Parse order ID, medicine, status, seller from push data |
| 15.5 | Notification channels | Separate channels for order updates and low-stock alerts |
| 15.6 | Android 13+ notification permission | Runtime permission request on launch |
| 15.7 | Notification tap navigation | Open app (seller dashboard deep link for low stock) |

---

## Phase 16 — Local Data & Persistence

| # | Feature | Description |
|---|---------|-------------|
| 16.1 | Room SQLite database | Local persistence (`pharma_bazaar_db`) |
| 16.2 | Master medicine catalog | Reference drug database (brand, generic, MRP, form) |
| 16.3 | Offer listings storage | Full listing schema with batch, expiry, MOQ, status |
| 16.4 | Cart persistence | Cart items stored locally |
| 16.5 | Buy requests storage | Order/request records |
| 16.6 | Chat messages storage | Per-request message history |
| 16.7 | Shop profiles storage | Multiple pharmacy profiles |
| 16.8 | Watchlist storage | Saved medicines |
| 16.9 | Price threshold & triggered alert storage | Alert rules and fired events |
| 16.10 | Sample data seeding | Auto-populate demo shops, offers, requests, and chat on first run |

---

## Phase 17 — Utilities & Platform

| # | Feature | Description |
|---|---------|-------------|
| 17.1 | Secrets/env config | `GEMINI_API_KEY` injected via Secrets Gradle Plugin from `.env` |
| 17.2 | Debug/release signing configs | Keystore-based APK signing setup |
| 17.3 | FileProvider | Secure file sharing for CSV exports |
| 17.4 | Internet permission | Network access for API and Firebase |
| 17.5 | RTL support | App manifest RTL enabled |
| 17.6 | App backup rules | Android backup/data extraction configuration |
| 17.7 | Test tags | Compose UI test tags on key navigation and action elements |

---

## Status Legend (for gap reports)

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented |
| 🟡 | Partially implemented |
| ❌ | Missing |
| ⚠ | Needs improvement |

---

## Related Documents

- `docs/feature-gap-report.md` — Codebase comparison against this spec
- `docs/implementation-roadmap.md` — Phased delivery plan
- `docs/design-system.md` — UI/UX design tokens and patterns
