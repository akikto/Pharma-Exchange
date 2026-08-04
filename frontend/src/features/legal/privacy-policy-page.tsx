/**
 * Privacy Policy for Pharma-Exchange (BL-04 · Sprint 4).
 *
 * Content is duplicated in Markdown at docs/PRIVACY-POLICY.md so legal
 * reviewers can PR either file — a lint step (docs/PLAY-STORE-COMPLIANCE.md)
 * spot-checks that both stay aligned.
 */
import { Link } from 'react-router-dom';
import { LegalPage } from './legal-page';

export const PRIVACY_EFFECTIVE_DATE = '2026-01-15';
export const PRIVACY_LAST_REVIEWED = '2026-01-15';

export function PrivacyPolicyPage() {
  return (
    <LegalPage
      id="privacy-policy"
      title="Privacy Policy"
      effectiveDate={PRIVACY_EFFECTIVE_DATE}
      lastReviewed={PRIVACY_LAST_REVIEWED}
      seoDescription="How Pharma-Exchange collects, uses and protects the data of pharmacies and buyers who use our Bangladesh B2B medicine marketplace."
    >
      <Section title="1. Who we are">
        <p>
          Pharma-Exchange (“we”, “our”, “the app”) is a business-to-business
          medicine marketplace connecting verified pharmacies and buyers in
          Bangladesh. This Privacy Policy explains what personal data we
          collect when you use our website, mobile app, and API, why we
          collect it, how it is stored, and the choices you have.
        </p>
      </Section>

      <Section title="2. Data we collect">
        <SubSection title="2.1 Account data">
          <ul className="list-disc pl-6">
            <li>Full name, email address and/or mobile number</li>
            <li>Hashed password (bcrypt, cost factor 12)</li>
            <li>Role (buyer, seller, admin) and pharmacy affiliation</li>
            <li>Preferred language and theme</li>
            <li>Notification preferences (email / push / SMS)</li>
          </ul>
        </SubSection>
        <SubSection title="2.2 Verification data (sellers only)">
          <ul className="list-disc pl-6">
            <li>Pharmacy name, address and district</li>
            <li>Trade licence number and uploaded licence document</li>
            <li>Drug licence number and uploaded licence document</li>
            <li>Business contact details</li>
          </ul>
        </SubSection>
        <SubSection title="2.3 Commercial data">
          <ul className="list-disc pl-6">
            <li>Listings, prices, batch numbers, expiry dates, stock</li>
            <li>Buy requests, cart items, orders, invoices, reviews</li>
            <li>Chat messages between buyer and seller</li>
          </ul>
        </SubSection>
        <SubSection title="2.4 Payment data">
          <p>
            Payments are processed by <strong>Razorpay</strong>. Card, UPI,
            wallet and net-banking credentials are collected exclusively by
            Razorpay's hosted checkout — they never touch our servers. We
            retain only the Razorpay order id, payment id, refund id, amount,
            currency, method used, and payment status.
          </p>
        </SubSection>
        <SubSection title="2.5 Authentication data">
          <p>
            When you sign in with Google or with your phone number we use{' '}
            <strong>Firebase Authentication</strong> to verify your
            credentials. Firebase gives us an anonymous unique identifier
            (UID), your email and (for phone auth) your phone number. We do
            not receive your Google password.
          </p>
        </SubSection>
        <SubSection title="2.6 SMS OTP">
          <p>
            One-time codes are sent by <strong>MSG91</strong> to the phone
            number you provide. MSG91 handles OTP generation, delivery, and
            verification. We store only that a request was made, not the OTP
            code itself.
          </p>
        </SubSection>
        <SubSection title="2.7 Device and technical data">
          <ul className="list-disc pl-6">
            <li>Device model, OS version, app version</li>
            <li>IP address (used for rate limiting and abuse detection)</li>
            <li>Firebase Cloud Messaging (FCM) token for push notifications</li>
            <li>Crash logs and non-personally-identifying analytics events</li>
          </ul>
        </SubSection>
        <SubSection title="2.8 Cookies and local storage">
          <p>
            The web app stores your session tokens (access + refresh JWT),
            theme preference, and language in your browser's{' '}
            <code>localStorage</code>. We use a first-party session cookie only
            when required by Razorpay Checkout. We do <strong>not</strong> use
            third-party advertising cookies or trackers.
          </p>
        </SubSection>
      </Section>

      <Section title="3. Why we collect it (legal basis)">
        <ul className="list-disc pl-6">
          <li>
            <strong>Contract:</strong> to create accounts, list medicines,
            match buyers with sellers, take orders and settle payments.
          </li>
          <li>
            <strong>Legal obligation:</strong> to verify pharmacy licences
            under the Drugs (Control) Ordinance 1982 and to keep the audit
            trail required for pharmaceutical wholesale commerce.
          </li>
          <li>
            <strong>Legitimate interest:</strong> to prevent fraud, secure
            the platform (rate limiting, HMAC signing, revocation checks),
            and improve the service.
          </li>
          <li>
            <strong>Consent:</strong> for optional features such as push
            notifications and marketing emails. You may withdraw consent at
            any time.
          </li>
        </ul>
      </Section>

      <Section title="4. Where your data lives">
        <ul className="list-disc pl-6">
          <li>
            <strong>PostgreSQL</strong> (managed provider, hosted in Asia
            region) is the primary database for accounts, listings, orders,
            payments and audit logs.
          </li>
          <li>
            <strong>Firebase</strong> (Google Cloud) stores authentication
            identities, FCM device tokens, and uploaded license/document
            files (private storage bucket, server-brokered signed URLs).
          </li>
          <li>
            <strong>Razorpay</strong> stores payment credentials and
            transaction records under their own PCI-DSS-certified
            infrastructure.
          </li>
          <li>
            <strong>MSG91</strong> stores OTP delivery logs for the retention
            period required by TRAI / regional telecom regulations.
          </li>
        </ul>
      </Section>

      <Section title="5. Sharing and disclosure">
        <p>We share data only with the sub-processors listed above and, when strictly required:</p>
        <ul className="list-disc pl-6">
          <li>
            With the counter-party of an order or buy request (buyer sees the
            seller's pharmacy name, address, and rating; seller sees the
            buyer's name and delivery address after acceptance).
          </li>
          <li>
            With regulators, courts, or law-enforcement agencies when we
            receive a valid legal request under Bangladeshi law.
          </li>
          <li>
            With auditors and payment reconciliation partners under a written
            confidentiality agreement.
          </li>
        </ul>
        <p>
          We never sell your data, and we do not use it to train external AI
          models.
        </p>
      </Section>

      <Section title="6. Device permissions">
        <ul className="list-disc pl-6">
          <li>
            <strong>Push notifications:</strong> optional. Used only for
            order updates, chat, and price alerts.
          </li>
          <li>
            <strong>Camera / photo library:</strong> optional. Used to
            capture licence documents and product photos when you upload
            them.
          </li>
          <li>
            <strong>Storage:</strong> optional. Used when you save an invoice
            or receipt.
          </li>
          <li>
            <strong>Location:</strong> optional. Used only if you tap
            “nearest pharmacy” — never collected in the background.
          </li>
        </ul>
        <p>
          Each permission is requested with a clear on-screen rationale and
          can be revoked from your device settings at any time.
        </p>
      </Section>

      <Section title="7. Retention">
        <ul className="list-disc pl-6">
          <li>
            Account data: for as long as the account is active, plus 24
            months after deactivation, then anonymised.
          </li>
          <li>
            Order, invoice, and payment records: 5 years (statutory
            requirement for wholesale commerce).
          </li>
          <li>
            Chat messages: 12 months, then archived to cold storage.
          </li>
          <li>
            Server logs, rate-limit history: 30 days.
          </li>
        </ul>
      </Section>

      <Section title="8. Your rights">
        <p>
          Under Bangladesh's Digital Security Act 2018 and general privacy
          best practice you have the right to:
        </p>
        <ul className="list-disc pl-6">
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate data — you can edit most fields yourself in <em>Settings → Profile</em>.</li>
          <li>Request deletion of your account (see next section).</li>
          <li>Export your data in a machine-readable format.</li>
          <li>Object to processing for marketing purposes.</li>
        </ul>
        <p>
          Email{' '}
          <a className="underline" href="mailto:privacy@pharma-exchange.bd">
            privacy@pharma-exchange.bd
          </a>{' '}
          with your registered email/phone number to exercise these rights.
          We reply within 30 days.
        </p>
      </Section>

      <Section title="9. Account deletion">
        <p>Two paths:</p>
        <ul className="list-disc pl-6">
          <li>
            <strong>In-app:</strong> <em>Settings → Account → Delete
            account</em>. Requires re-authentication. Executes within 30 days
            (retention above applies to legal records).
          </li>
          <li>
            <strong>Email:</strong> write to{' '}
            <a className="underline" href="mailto:privacy@pharma-exchange.bd">
              privacy@pharma-exchange.bd
            </a>{' '}
            from your registered address.
          </li>
        </ul>
      </Section>

      <Section title="10. Security">
        <p>
          Data in transit is protected with TLS 1.2+ (HSTS enforced with a
          one-year <code>max-age</code> and <code>preload</code>). Passwords
          are hashed with bcrypt. JWT signing secrets are 32 characters
          minimum and rotated quarterly. Payment webhooks use HMAC-SHA256
          with a dedicated secret. Access to production systems is behind
          multi-factor authentication and least-privilege IAM roles.
        </p>
      </Section>

      <Section title="11. Children">
        <p>
          Pharma-Exchange is a business-to-business platform and is not
          intended for anyone under 18. We do not knowingly collect data
          from minors.
        </p>
      </Section>

      <Section title="12. Changes to this policy">
        <p>
          Material changes will be announced in-app and by email at least 14
          days before they take effect. The current version is always
          available at{' '}
          <Link className="underline" to="/privacy-policy">
            /privacy-policy
          </Link>
          .
        </p>
      </Section>

      <Section title="13. Contact">
        <p>
          Data Protection Officer<br />
          Pharma-Exchange<br />
          Email:{' '}
          <a className="underline" href="mailto:privacy@pharma-exchange.bd">
            privacy@pharma-exchange.bd
          </a>
          <br />
          Legal enquiries:{' '}
          <a className="underline" href="mailto:legal@pharma-exchange.bd">
            legal@pharma-exchange.bd
          </a>
        </p>
      </Section>
    </LegalPage>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium text-text-primary sm:text-lg">{title}</h3>
      {children}
    </div>
  );
}
