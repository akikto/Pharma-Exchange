import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { AdminDashboardPage } from '@/features/admin/admin-dashboard-page';
import { adminBottomNav } from '@/components/layout/nav-config';

const apiGet = vi.fn();

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGet(...args),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/use-nav-badges', () => ({
  useNavBadges: () => ({ notifications: 0, cart: 0, chat: 0, requests: 0, watchlist: 0 }),
}));

import { TopBar } from '@/components/layout/top-bar';

function renderDashboard() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/" element={<div data-testid="marketplace-home">Home</div>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('Admin Dashboard TopBar marketplace back', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({
      gmv: 0,
      activePharmacies: 0,
      pendingVerifications: 0,
      openReports: 0,
      totalOrders: 0,
      activeListings: 0,
    });
  });

  it('shows mobile marketplace back control with accessible label on /admin', async () => {
    renderDashboard();
    const back = await screen.findByTestId('admin-dashboard-back-marketplace');
    expect(back).toHaveAttribute('aria-label', 'Back to Marketplace');
    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
  });

  it('navigates to marketplace home when back is clicked', async () => {
    renderDashboard();
    fireEvent.click(await screen.findByTestId('admin-dashboard-back-marketplace'));
    expect(await screen.findByTestId('marketplace-home')).toBeInTheDocument();
  });

  it('keeps admin bottom Alerts route pointed at /admin/notifications', () => {
    const alerts = adminBottomNav.find((item) => item.labelKey === 'notifications');
    expect(alerts?.to).toBe('/admin/notifications');
  });
});

describe('TopBar on other admin routes', () => {
  it('still exposes notifications on non-dashboard admin pages', async () => {
    const { TopBar } = await import('@/components/layout/top-bar');
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/admin/sellers']}>
          <TopBar title="Sellers" />
        </MemoryRouter>
      </I18nextProvider>,
    );
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.queryByTestId('admin-dashboard-back-marketplace')).not.toBeInTheDocument();
  });
});
