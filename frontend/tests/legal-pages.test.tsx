/**
 * Smoke tests for the Privacy Policy and Terms & Conditions pages.
 *
 * We render each page inside a MemoryRouter and confirm the required
 * legal sections and testable landmarks are present. This defends against
 * accidental deletions during future UI refactors.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyPolicyPage } from '@/features/legal/privacy-policy-page';
import { TermsAndConditionsPage } from '@/features/legal/terms-and-conditions-page';

function renderWithRouter(ui: React.ReactElement, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>,
  );
}

describe('PrivacyPolicyPage', () => {
  it('renders with the required BL-04 sections', { timeout: 20_000 }, () => {
    renderWithRouter(<PrivacyPolicyPage />, '/privacy-policy');

    expect(screen.getByTestId('privacy-policy-page')).toBeInTheDocument();
    expect(screen.getByTestId('privacy-policy-title')).toHaveTextContent('Privacy Policy');

    // Section headings the BL-04 spec calls out.
    const required = [
      /Data we collect/i,
      /Payment data/i,       // Razorpay
      /Authentication data/i, // Firebase
      /Password reset email/i,
      /Cookies and local storage/i,
      /Device permissions/i,
      /Your rights/i,
      /Retention/i,
      /Account deletion/i,
      /Contact/i,
    ];
    for (const heading of required) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    }

    expect(screen.getByRole('link', { name: /Terms & Conditions/i })).toHaveAttribute(
      'href',
      '/terms-and-conditions',
    );
  });
});

describe('TermsAndConditionsPage', () => {
  it('renders with the required BL-05 sections', { timeout: 20_000 }, () => {
    renderWithRouter(<TermsAndConditionsPage />, '/terms-and-conditions');

    expect(screen.getByTestId('terms-and-conditions-page')).toBeInTheDocument();
    expect(screen.getByTestId('terms-and-conditions-title')).toHaveTextContent(
      'Terms & Conditions',
    );

    const required = [
      /Marketplace usage/i,
      /Buyer responsibilities/i,
      /Seller responsibilities/i,
      /Medicine listing rules/i,
      /Payment rules/i,
      /Refund policy/i,
      /Order cancellation/i,
      /Intellectual property/i,
      /Prohibited activities/i,
      /Limitation of liability/i,
      /Governing law/i,
      /Contact/i,
    ];
    for (const heading of required) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    }

    expect(
      screen.getAllByRole('link', { name: /Privacy Policy/i })[0],
    ).toHaveAttribute('href', '/privacy-policy');
  });
});
