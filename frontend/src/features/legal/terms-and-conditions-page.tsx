/**
 * Terms & Conditions for Pharma-Exchange (BL-05 · Sprint 4).
 * Duplicated in docs/TERMS-AND-CONDITIONS.md.
 */
import { Link } from 'react-router-dom';
import { LegalPage } from './legal-page';

export const TERMS_EFFECTIVE_DATE = '2026-01-15';
export const TERMS_LAST_REVIEWED = '2026-01-15';

export function TermsAndConditionsPage() {
  return (
    <LegalPage
      id="terms-and-conditions"
      title="Terms & Conditions"
      effectiveDate={TERMS_EFFECTIVE_DATE}
      lastReviewed={TERMS_LAST_REVIEWED}
      seoDescription="The legal agreement between Pharma-Exchange and every buyer, seller, and admin who uses the Bangladesh B2B pharmacy marketplace."
    >
      <Section title="1. Acceptance of these terms">
        <p>
          By creating an account or otherwise using Pharma-Exchange (“the
          Platform”, “we”, “our”) you agree to be bound by these Terms &
          Conditions and by our{' '}
          <Link className="underline" to="/privacy-policy">
            Privacy Policy
          </Link>
          . If you do not accept them, do not use the Platform.
        </p>
      </Section>

      <Section title="2. What Pharma-Exchange is">
        <p>
          Pharma-Exchange is a business-to-business medicine marketplace
          operating in Bangladesh. We connect verified pharmacy sellers with
          buyers (retail pharmacies, clinics, distributors). We are a
          <strong> facilitator </strong>only — we do not manufacture, store,
          dispense, or physically deliver medicines. Every trade happens
          between a buyer and a seller.
        </p>
      </Section>

      <Section title="3. Eligibility">
        <ul className="list-disc pl-6">
          <li>You must be at least 18 years old.</li>
          <li>
            You must have legal authority to bind the pharmacy business you
            represent.
          </li>
          <li>
            Sellers must possess valid Trade and Drug licences and must
            complete our verification process before listing.
          </li>
        </ul>
      </Section>

      <Section title="4. Marketplace usage">
        <p>You agree to use the Platform only for lawful commerce and to:</p>
        <ul className="list-disc pl-6">
          <li>Provide accurate, current, and complete information.</li>
          <li>Keep your login credentials confidential.</li>
          <li>Notify us immediately of any unauthorised use of your account.</li>
          <li>Comply with all applicable pharmacy, tax, and export regulations.</li>
        </ul>
      </Section>

      <Section title="5. Buyer responsibilities">
        <ul className="list-disc pl-6">
          <li>Verify that any medicine you order is appropriate for your intended use.</li>
          <li>Pay for confirmed orders on time.</li>
          <li>Inspect goods upon receipt and raise defects within 48 hours of delivery.</li>
          <li>Never resell to end consumers who are not authorised to purchase pharmaceuticals.</li>
          <li>
            Maintain the cold chain for temperature-sensitive medicines from
            the moment of delivery.
          </li>
        </ul>
      </Section>

      <Section title="6. Seller responsibilities">
        <ul className="list-disc pl-6">
          <li>Ensure your Trade and Drug licences are valid at all times.</li>
          <li>Only list medicines you legally own and are licensed to sell.</li>
          <li>Display accurate batch numbers, MRP, expiry dates, and stock levels.</li>
          <li>Honour every confirmed order within the agreed timeline or cancel with a documented reason.</li>
          <li>Pack medicines in tamper-evident containers with proper cold-chain protection where required.</li>
          <li>Provide a GST/VAT-compliant invoice for every order.</li>
        </ul>
      </Section>

      <Section title="7. Medicine listing rules">
        <ul className="list-disc pl-6">
          <li>
            <strong>Prohibited items:</strong> narcotics, psychotropics under
            special licence, medicines under DGDA recall, veterinary
            products unless flagged as such, cosmetics or nutraceuticals
            marketed as prescription medicines.
          </li>
          <li>
            <strong>Expiry:</strong> listings must have at least 90 days of
            shelf life at the time of listing unless clearly marked as
            “short-dated” with a mandatory discount.
          </li>
          <li>
            <strong>Photos:</strong> genuine, unmodified photos of the actual
            stock. No stock imagery, no manufacturer marketing materials
            without permission.
          </li>
          <li>
            <strong>Pricing:</strong> MRP must not exceed the manufacturer's
            printed price. Discounts must be calculated against the MRP.
          </li>
        </ul>
      </Section>

      <Section title="8. Payment rules">
        <ul className="list-disc pl-6">
          <li>
            Payments are processed by <strong>Razorpay</strong>. By checking
            out you also accept Razorpay's terms.
          </li>
          <li>
            Orders move to <em>CONFIRMED</em> only after Razorpay confirms
            capture. No physical dispatch may occur until the order is
            confirmed.
          </li>
          <li>
            Prices are in the currency shown at checkout (INR by default;
            configurable per market). Any FX conversion is at your card
            issuer's rates.
          </li>
          <li>
            The Platform charges the fees stated in the seller onboarding
            agreement. Fees are deducted from settlements, not billed
            separately, unless the agreement says otherwise.
          </li>
        </ul>
      </Section>

      <Section title="9. Refund policy">
        <ul className="list-disc pl-6">
          <li>
            <strong>Full refund</strong> if the seller cancels a confirmed
            order before shipping, or if goods do not match the listing on
            inspection.
          </li>
          <li>
            <strong>Partial refund</strong> for short-shipped orders,
            proportional to the missing quantity.
          </li>
          <li>
            <strong>No refund</strong> for cold-chain medicines once
            delivery is accepted and the temperature indicator shows correct
            handling.
          </li>
          <li>
            Refund requests must be raised within 48 hours of delivery.
            Approved refunds are processed via Razorpay and reach the
            original payment method within 5–7 business days.
          </li>
        </ul>
      </Section>

      <Section title="10. Order cancellation">
        <ul className="list-disc pl-6">
          <li>
            Buyers may cancel a payment that has not been captured yet with
            no penalty.
          </li>
          <li>
            After capture but before <em>PACKED</em>, either party may
            cancel; the paid amount is refunded in full.
          </li>
          <li>
            After <em>SHIPPED</em>, cancellations require mutual agreement
            and a return of the goods in original condition.
          </li>
        </ul>
      </Section>

      <Section title="11. Intellectual property">
        <p>
          The Platform, its logos, code, and content are the property of
          Pharma-Exchange or its licensors and are protected by copyright
          and trademark law. You are granted a limited, non-transferable
          licence to use the Platform for its intended purpose. Any content
          you upload (listings, photos, reviews) remains yours; you grant us
          a non-exclusive licence to display and distribute it within the
          Platform for the purposes of running the marketplace.
        </p>
      </Section>

      <Section title="12. Prohibited activities">
        <ul className="list-disc pl-6">
          <li>Impersonating another person, pharmacy, or organisation.</li>
          <li>Uploading forged licence documents.</li>
          <li>Manipulating prices, reviews, or ratings.</li>
          <li>Reverse-engineering, scraping, or overloading the API.</li>
          <li>Uploading malware, viruses, or offensive content.</li>
          <li>Circumventing the payment flow by soliciting off-platform payment.</li>
          <li>Using the Platform for money laundering or sanctions evasion.</li>
        </ul>
        <p>Violations may lead to immediate suspension and legal action.</p>
      </Section>

      <Section title="13. Suspension and termination">
        <p>
          We may suspend or terminate your account with written notice if
          you materially breach these Terms, upload false documents, engage
          in prohibited activity, or fail to pay confirmed orders. You may
          close your account at any time via <em>Settings → Account →
          Delete account</em>. Termination does not affect obligations that
          arose before the termination date.
        </p>
      </Section>

      <Section title="14. Disclaimers">
        <p>
          The Platform is provided <strong>“as is”</strong>. We do not
          guarantee that (a) any listed medicine will be suitable for your
          use, (b) the Platform will be uninterrupted, or (c) that all
          listings are error-free. Buyers must exercise their own
          professional judgment when purchasing medicines.
        </p>
      </Section>

      <Section title="15. Limitation of liability">
        <p>
          To the maximum extent permitted by Bangladeshi law,
          Pharma-Exchange's aggregate liability for any claim arising out of
          or related to the Platform is limited to the greater of (a) the
          fees you paid to us in the 12 months preceding the claim or (b)
          BDT 25 000. We are not liable for indirect, incidental,
          consequential, or exemplary damages, or for loss of profit, data
          or goodwill.
        </p>
      </Section>

      <Section title="16. Indemnity">
        <p>
          You agree to indemnify Pharma-Exchange, its officers, employees,
          and sub-processors against any claim, loss, or expense (including
          reasonable legal fees) arising from your breach of these Terms,
          your violation of any law, or your infringement of a third party's
          rights.
        </p>
      </Section>

      <Section title="17. Governing law and dispute resolution">
        <p>
          These Terms are governed by the laws of the People's Republic of
          Bangladesh. Any dispute that cannot be resolved amicably will be
          referred to arbitration in Dhaka in English under the Arbitration
          Act 2001. The seat of arbitration is Dhaka; the courts of Dhaka
          have exclusive jurisdiction over matters that cannot be
          arbitrated.
        </p>
      </Section>

      <Section title="18. Changes to these terms">
        <p>
          We may amend these Terms; the current version is always available
          at{' '}
          <Link className="underline" to="/terms-and-conditions">
            /terms-and-conditions
          </Link>
          . Material changes are announced in-app and by email at least 14
          days before they take effect. Continued use of the Platform after
          the effective date constitutes acceptance.
        </p>
      </Section>

      <Section title="19. Contact">
        <p>
          Pharma-Exchange<br />
          Email:{' '}
          <a className="underline" href="mailto:legal@pharma-exchange.bd">
            legal@pharma-exchange.bd
          </a>
          <br />
          Support:{' '}
          <a className="underline" href="mailto:support@pharma-exchange.bd">
            support@pharma-exchange.bd
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
