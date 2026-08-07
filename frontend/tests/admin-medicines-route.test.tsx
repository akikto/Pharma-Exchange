import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { AppRouter } from '@/app/router';

const authState = vi.hoisted(() => ({
  user: {
    id: 'buyer-1',
    email: 'buyer@pharmex.bd',
    firstName: 'Buyer',
    lastName: 'User',
    role: 'USER' as const,
  },
  isAuthenticated: true,
  isLoading: false,
  mode: 'buyer' as const,
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: (state: typeof authState) => unknown) =>
    selector ? selector(authState) : authState,
}));

vi.mock('@/components/layout/top-bar', () => ({
  TopBar: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    getText: vi.fn(),
    upload: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

describe('Admin medicines admin-only access', () => {
  beforeEach(() => {
    void i18n.changeLanguage('en');
    window.history.pushState({}, '', '/admin/medicines');
  });

  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('redirects non-admin users away from /admin/medicines', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <AppRouter />
        </QueryClientProvider>
      </I18nextProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('admin-medicines-page')).not.toBeInTheDocument();
    });
  });
});
