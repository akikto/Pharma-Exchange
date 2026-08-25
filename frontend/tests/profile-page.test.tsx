import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { ProfilePage } from '@/features/profile/profile-page';
import { isNavItemActive } from '@/components/layout/nav-config';
import { buyerNav } from '@/components/layout/nav-config';

const authState = vi.hoisted(() => ({
  user: {
    id: 'buyer-1',
    email: 'buyer@pharmex.bd',
    firstName: 'Buyer',
    lastName: 'User',
    role: 'USER' as const,
    pharmacy: undefined,
  },
  mode: 'buyer' as const,
  isAuthenticated: true,
  setMode: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: (state: typeof authState) => unknown) =>
    selector
      ? selector(authState)
      : authState,
}));

vi.mock('@/stores/theme-store', () => ({
  useThemeStore: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

vi.mock('@/hooks/use-user-settings', () => ({
  useUpdateProfile: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/components/layout/top-bar', () => ({
  TopBar: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/components/profile/edit-profile-dialog', () => ({
  EditProfileDialog: () => null,
}));

function renderProfile(initialPath = '/profile') {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<div data-testid="admin-dashboard-page">Admin Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('ProfilePage admin dashboard link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = {
      id: 'buyer-1',
      email: 'buyer@pharmex.bd',
      firstName: 'Buyer',
      lastName: 'User',
      role: 'USER',
      pharmacy: undefined,
    };
    authState.mode = 'buyer';
  });

  it('shows Admin Dashboard for ADMIN and navigates to /admin', () => {
    authState.user = {
      id: 'admin-1',
      email: 'admin@pharmex.bd',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      pharmacy: undefined,
    };
    renderProfile();
    const link = screen.getByTestId('profile-admin-dashboard');
    expect(link).toHaveTextContent('Admin Dashboard');
    expect(link).toHaveAttribute('href', '/admin');
    fireEvent.click(link);
    expect(screen.getByTestId('admin-dashboard-page')).toBeInTheDocument();
  });

  it('does not show Admin Dashboard for buyer', () => {
    renderProfile();
    expect(screen.queryByTestId('profile-admin-dashboard')).not.toBeInTheDocument();
    expect(screen.getByTestId('edit-profile-button')).toBeInTheDocument();
  });

  it('does not show Admin Dashboard for approved seller', () => {
    authState.user = {
      id: 'seller-1',
      email: 'seller@pharmex.bd',
      firstName: 'Seller',
      lastName: 'User',
      role: 'USER',
      pharmacy: {
        id: 'p1',
        name: 'City Pharmacy',
        verificationStatus: 'APPROVED',
      },
    };
    renderProfile();
    expect(screen.queryByTestId('profile-admin-dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Buying')).toBeInTheDocument();
  });

  it('keeps marketplace Home active only on / for buyers', () => {
    const home = buyerNav[0];
    expect(isNavItemActive('/', home)).toBe(true);
    expect(isNavItemActive('/admin', home)).toBe(false);
  });
});
