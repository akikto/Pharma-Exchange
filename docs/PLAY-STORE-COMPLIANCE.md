# Google Play Store Compliance — Pharma-Exchange

Everything Google's review team looks for when the Pharma-Exchange PWA/TWA
is submitted to the Play Store. This doc lives alongside
[PRIVACY-POLICY.md](PRIVACY-POLICY.md) and
[TERMS-AND-CONDITIONS.md](TERMS-AND-CONDITIONS.md) and is the single
source of truth for the answers we give in the Play Console.

---

## 1. Public URLs to enter in the Play Console

| Play Console field | URL |
|---|---|
| **Privacy policy** | `https://<production-domain>/privacy-policy` |
| **Terms of service** (optional) | `https://<production-domain>/terms-and-conditions` |
| **Support email** | `support@pharma-exchange.bd` |
| **Support website** | `https://<production-domain>/settings` |

Both pages are:
- Publicly accessible without authentication.
- SEO-tagged (title + meta description set on mount).
- Print-friendly (`@media print` overrides in `index.css`).
- Accessible (single `<h1>`, ordered headings, focusable back link,
  keyboard-reachable print button).

## 2. Data Safety form

Fill the Play Console *Data Safety* form to match the answers below —
these are derived directly from
[PRIVACY-POLICY.md § 2 Data we collect](PRIVACY-POLICY.md#2-data-we-collect).

### Data collected and shared

| Category | Type | Collected? | Shared with third party? | Purpose | Optional? |
|---|---|:---:|:---:|---|:---:|
| Personal info | Name | ✅ | Sub-processors only | Account management, order fulfilment | No |
| Personal info | Email address | ✅ | Sub-processors only | Sign-in, order updates, marketing (with consent) | Yes* |
| Personal info | Phone number | ✅ | MSG91 (OTP), Firebase (phone auth) | Sign-in, order updates | Yes* |
| Personal info | Address (pharmacy) | ✅ | Sub-processors only | Verification, fulfilment | No |
| Personal info | User IDs | ✅ | Firebase | Authentication | No |
| Financial info | Purchase history | ✅ | Razorpay | Order & refund processing | No |
| Financial info | Payment info | 🚫 (Razorpay-collected) | Razorpay | Payment processing | No |
| App activity | App interactions | ✅ | ⛔ Not shared | Product improvement, analytics | Yes |
| App info & performance | Crash logs, diagnostics | ✅ | ⛔ Not shared | Bug fixing | No |
| Device or other IDs | FCM registration token | ✅ | Firebase | Push notifications | Yes |

*Optional if the user picked the other channel — at least one of
{email, phone} is required for account creation.

### Data security answers

- **Data is encrypted in transit** — ✅ TLS 1.2+ everywhere, HSTS 1y preload.
- **Users can request data deletion** — ✅ In-app *Settings → Account → Delete account* + email.
- **Data collection commitment to Play Families Policy** — N/A (not a family app).
- **Independent security review** — ⏳ Pending (call out on the store listing when done).

## 3. User Data Policy alignment

Google's [User Data Policy](https://support.google.com/googleplay/android-developer/answer/10787469)
requirements and where each is satisfied:

| Requirement | Where satisfied |
|---|---|
| Disclose data types collected | [Privacy Policy § 2](PRIVACY-POLICY.md#2-data-we-collect) |
| Disclose data usage | [Privacy Policy § 3](PRIVACY-POLICY.md#3-why-we-collect-it-legal-basis) |
| Disclose sharing | [Privacy Policy § 5](PRIVACY-POLICY.md#5-sharing-and-disclosure) |
| Provide deletion mechanism | [Privacy Policy § 9](PRIVACY-POLICY.md#9-account-deletion) + in-app link |
| Secure transmission | TLS 1.2+, HSTS 1y (BL-03 audit) |
| Sensitive permissions justified in-app | [Privacy Policy § 6](PRIVACY-POLICY.md#6-device-permissions) |
| Minor-safe | [Privacy Policy § 11](PRIVACY-POLICY.md#11-children) — B2B, 18+ only |

## 4. Sub-processor disclosures

| Service | Purpose | Play Store disclosure line |
|---|---|---|
| **Firebase Authentication** (Google LLC) | Sign-in, phone auth | "We use Firebase Authentication (Google) to verify your account." |
| **Firebase Cloud Messaging** (Google LLC) | Push notifications | "We use Firebase Cloud Messaging to send you order updates." |
| **Razorpay** (Razorpay Software Pvt. Ltd.) | Payments | "Payments are processed by Razorpay." |
| **MSG91** (Walkover Web Solutions) | SMS OTP | "SMS one-time codes are delivered by MSG91." |
| **PostgreSQL** (managed provider) | Database | Internal; not user-facing. |

## 5. Runtime permission rationale

Each sensitive permission is requested with an in-app rationale screen the
user must acknowledge. Text lives in
`frontend/src/features/permissions/`. Bullet copy:

- **`POST_NOTIFICATIONS`** (Android 13+):
  > "Allow notifications to get instant alerts when a buyer accepts your
  > listing, an order is confirmed, or a payment succeeds."
- **`CAMERA`**:
  > "We use the camera only when you tap 'Take photo' while uploading a
  > licence document or a product image."
- **`READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE`**:
  > "Used only when you attach photos to a listing or save an invoice."
- **`ACCESS_FINE_LOCATION`** (opt-in):
  > "Used only when you tap 'Nearest pharmacy' to sort results by distance.
  > We do not read your location in the background."

## 6. Play Store listing checklist

- [ ] Screenshots (7 required, 5 for tablet).
- [ ] Short description (80 chars): "Verified B2B pharmacy marketplace for Bangladesh — list, buy, and settle."
- [ ] Full description (4000 chars): draft in `docs/play-store-listing.md` (create when submitting; not required now).
- [ ] Feature graphic (1024×500).
- [ ] Icon (512×512, transparent background).
- [ ] App category: Business.
- [ ] Content rating: complete IARC questionnaire (expected rating: Everyone).
- [ ] Target audience & content: adults (18+); *not* directed to children.

## 7. Content parity check

Both the rendered React page and the Markdown copy must stay in sync. When
you edit one, edit the other. This can be enforced later with a Danger.js
or lint-staged rule — for now it is a reviewer checklist:

- Section titles match one-for-one.
- Effective dates identical.
- Sub-processor names identical.

## 8. Manual actions before submission

- [ ] Deploy Sprint 4 to production and verify `/privacy-policy` and
      `/terms-and-conditions` load unauthenticated.
- [ ] Verify HSTS is served (curl `-I` from an outside network).
- [ ] Firebase Auth → Authorized Domains includes the production domain.
- [ ] `firebase deploy --only firestore:rules,storage` (from Sprint 3).
- [ ] Play Console → Data Safety form filled per § 2 above.
- [ ] Screenshots captured on a real device (not emulator).
- [ ] Internal test track invited: 5+ real pharmacies for a 14-day pilot.
