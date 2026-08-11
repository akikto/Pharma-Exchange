import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { LoginPage } from '@/features/auth/login-page';

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      login: vi.fn(),
      register: vi.fn(),
      fetchProfile: vi.fn(),
      user: null,
      mode: 'buyer',
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/components/auth/google-sign-in-button', () => ({
  GoogleSignInButton: () => <button type="button">Google Sign-In</button>,
}));

function renderLoginPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('LoginPage UI', () => {
  it('does not render demo login or site URL text', () => {
    renderLoginPage();

    expect(screen.queryByTestId('demo-login')).not.toBeInTheDocument();
    expect(screen.queryByText(/pharma-exchange-frontend\.vercel\.app/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/সঠিক সাইট/i)).not.toBeInTheDocument();
  });

  it('keeps sign-in form and legal links', () => {
    renderLoginPage();

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('auth-legal-links')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Privacy Policy/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Terms/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot password|পাসওয়ার্ড ভুলে/i })).toBeInTheDocument();
  });
});
