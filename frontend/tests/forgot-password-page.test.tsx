import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { ForgotPasswordPage } from '@/features/auth/forgot-password-page';

const forgotPassword = vi.fn().mockResolvedValue({ message: 'ok' });

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) => selector({
    forgotPassword,
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
  it('renders email-based reset flow', () => {
    renderPage();
    expect(screen.getByLabelText(/email|ইমেইল/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset email|রিসেট ইমেইল/i })).toBeInTheDocument();
  });

  it('submits email and shows success message', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/email|ইমেইল/i), { target: { value: 'buyer@pharmex.bd' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset email|রিসেট ইমেইল/i }));

    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith('buyer@pharmex.bd');
    });
    expect(await screen.findByTestId('forgot-password-sent')).toBeInTheDocument();
  });
});
