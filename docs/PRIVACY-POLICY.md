# Privacy Policy · Pharma-Exchange

> **Note:** This is the reviewable Markdown copy of the Privacy Policy.
> The live user-facing version is rendered by
> `frontend/src/features/legal/privacy-policy-page.tsx` at
> **`/privacy-policy`**. Both must be updated together — see
> [PLAY-STORE-COMPLIANCE.md § Content parity](PLAY-STORE-COMPLIANCE.md#content-parity).

**Effective date:** 2026-01-15
**Last reviewed:** 2026-01-15

Pharma-Exchange is operated in the People's Republic of Bangladesh.
Questions? [legal@pharma-exchange.bd](mailto:legal@pharma-exchange.bd)

---

## 1. Who we are

Pharma-Exchange (“we”, “our”, “the app”) is a business-to-business medicine
marketplace connecting verified pharmacies and buyers in Bangladesh. This
Privacy Policy explains what personal data we collect when you use our
website, mobile app, and API, why we collect it, how it is stored, and the
choices you have.

## 2. Data we collect

### 2.1 Account data
- Full name, email address and/or mobile number
- Hashed password (bcrypt, cost factor 12)
- Role (buyer, seller, admin) and pharmacy affiliation
- Preferred language and theme
- Notification preferences (email / push / SMS)

### 2.2 Verification data (sellers only)
- Pharmacy name, address and district
- Trade licence number and uploaded licence document
- Drug licence number and uploaded licence document
- Business contact details

### 2.3 Commercial data
- Listings, prices, batch numbers, expiry dates, stock
- Buy requests, cart items, orders, invoices, reviews
- Chat messages between buyer and seller

### 2.4 Payment data
Payments are processed by **Razorpay**. Card, UPI, wallet and net-banking
credentials are collected exclusively by Razorpay's hosted checkout — they
never touch our servers. We retain only the Razorpay order id, payment id,
refund id, amount, currency, method used, and payment status.

### 2.5 Authentication data
When you sign in with Google or with your phone number we use **Firebase
Authentication** to verify your credentials. Firebase gives us an anonymous
UID, your email and (for phone auth) your phone number. We do not receive
your Google password.

### 2.6 SMS OTP
One-time codes are sent by **MSG91** to the phone number you provide.
MSG91 handles OTP generation, delivery and verification. We store only that
a request was made, not the OTP code itself.

### 2.7 Device and technical data
- Device model, OS version, app version
- IP address (rate limiting and abuse detection)
- Firebase Cloud Messaging (FCM) token for push notifications
- Crash logs and non-personally-identifying analytics events

### 2.8 Cookies and local storage
The web app stores session tokens (access + refresh JWT), theme, and
language in `localStorage`. We use a first-party session cookie only when
required by Razorpay Checkout. We do not use third-party advertising
cookies or trackers.

## 3. Why we collect it (legal basis)

- **Contract**: to create accounts, list medicines, match buyers with sellers, take orders and settle payments.
- **Legal obligation**: to verify pharmacy licences under the Drugs (Control) Ordinance 1982 and to keep the audit trail required for pharmaceutical wholesale commerce.
- **Legitimate interest**: fraud prevention, security (rate limiting, HMAC signing, revocation checks), service improvement.
- **Consent**: for optional features such as push notifications and marketing emails. Consent may be withdrawn at any time.

## 4. Where your data lives

- **PostgreSQL** (managed provider, Asia region) — primary database for accounts, listings, orders, payments and audit logs.
- **Firebase** (Google Cloud) — Auth identities, FCM device tokens, and uploaded licence/document files (private bucket, server-brokered signed URLs).
- **Razorpay** — payment credentials and transaction records under their own PCI-DSS-certified infrastructure.
- **MSG91** — OTP delivery logs (regional telecom retention period).

## 5. Sharing and disclosure

We share data only with the sub-processors above and, when strictly required:

- With the counter-party of an order or buy request.
- With regulators, courts, or law-enforcement agencies on a valid legal request.
- With auditors and payment reconciliation partners under a written confidentiality agreement.

We never sell your data. We do not use it to train external AI models.

## 6. Device permissions

- **Push notifications** — optional; order updates, chat, price alerts.
- **Camera / photo library** — optional; licence documents and product photos.
- **Storage** — optional; saving invoices/receipts.
- **Location** — optional; only if you tap “nearest pharmacy”; never collected in the background.

Each permission is requested with an on-screen rationale and can be revoked in device settings.

## 7. Retention

- Account data: active + 24 months after deactivation → anonymised.
- Order / invoice / payment records: 5 years (statutory requirement).
- Chat messages: 12 months, then cold storage.
- Server / rate-limit logs: 30 days.

## 8. Your rights

Under Bangladesh's Digital Security Act 2018 and general privacy best
practice you have the right to access, correct, delete, export, and object
to processing of your personal data. Email
[privacy@pharma-exchange.bd](mailto:privacy@pharma-exchange.bd) with your
registered email/phone number. We reply within 30 days.

## 9. Account deletion

- **In-app:** *Settings → Account → Delete account*. Requires re-authentication. Executes within 30 days (retention above applies to legal records).
- **Email:** [privacy@pharma-exchange.bd](mailto:privacy@pharma-exchange.bd) from your registered address.

## 10. Security

TLS 1.2+ in transit (HSTS 1y, `preload`). bcrypt password hashing. JWT
secrets ≥ 32 chars, rotated quarterly. Payment webhooks use HMAC-SHA256.
Production access is behind MFA and least-privilege IAM.

## 11. Children

Pharma-Exchange is a B2B platform and is not intended for anyone under 18.
We do not knowingly collect data from minors.

## 12. Changes

Material changes are announced in-app and by email at least 14 days before
they take effect.

## 13. Contact

Data Protection Officer · Pharma-Exchange
- Privacy: [privacy@pharma-exchange.bd](mailto:privacy@pharma-exchange.bd)
- Legal: [legal@pharma-exchange.bd](mailto:legal@pharma-exchange.bd)
