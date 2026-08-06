import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { ForgotPasswordPage } from '@/features/auth/forgot-password-page';

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) => selector({
    sendOtp: vi.fn(),
    resendOtp: vi.fn(),
    resetPassword: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('ForgotPasswordPage', () => {
  it('renders phone-based reset flow', () => {
    renderPage();
    expect(screen.getByLabelText(/phone|ফোন/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset code|রিসেট কোড/i })).toBeInTheDocument();
  });
});
