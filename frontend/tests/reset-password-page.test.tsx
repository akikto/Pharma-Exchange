import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { ResetPasswordPage } from '@/features/auth/reset-password-page';

const resetPassword = vi.fn().mockResolvedValue({ message: 'ok' });

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) => selector({
    resetPassword,
  }),
}));

function renderPage(token?: string) {
  const path = token ? `/reset-password?token=${token}` : '/reset-password';
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('ResetPasswordPage', () => {
  it('shows missing token state', () => {
    renderPage();
    expect(screen.getByText(/invalid or missing|অবৈধ বা নেই/i)).toBeInTheDocument();
  });

  it('renders password form when token is present', () => {
    renderPage('a'.repeat(64));
    expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/new password|নতুন পাসওয়ার্ড/i)).toBeInTheDocument();
  });
});
