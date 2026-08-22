import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { SellerDashboardPage } from '@/features/seller/seller-dashboard-page';

const useSellerAnalytics = vi.fn();
const useBuyRequests = vi.fn();
const openModal = vi.fn();
const navBadges = vi.hoisted(() => ({ cart: 0, chat: 0, requests: 0, watchlist: 0 }));

vi.mock('@/hooks/use-nav-badges', () => ({
  useNavBadges: () => navBadges,
}));

vi.mock('@/hooks/use-api', () => ({
  useSellerAnalytics: (...args: unknown[]) => useSellerAnalytics(...args),
  useBuyRequests: (...args: unknown[]) => useBuyRequests(...args),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      isAuthenticated: true,
      user: {
        pharmacy: {
          id: 'pharm-1',
          name: 'City Pharmacy',
          verificationStatus: 'APPROVED',
        },
      },
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/stores/shell-store', () => ({
  useShellStore: (selector: (state: { openModal: () => void }) => unknown) =>
    selector({ openModal }),
}));

vi.mock('@/components/layout/top-bar', () => ({
  TopBar: ({ title }: { title: string }) => <div data-testid="top-bar">{title}</div>,
}));

function renderSellerDashboard() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <SellerDashboardPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('SellerDashboardPage mobile UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navBadges.cart = 0;
    navBadges.requests = 0;
    useSellerAnalytics.mockReturnValue({
      data: {
        todaySales: 1200,
        pendingBuyRequests: 2,
        activeListings: 5,
        rating: 4.5,
        shortExpiryAlert: 0,
      },
      isLoading: false,
      isError: false,
    });
    useBuyRequests.mockReturnValue({
      data: { data: [] },
    });
  });

  it('wraps Pending Buy Requests button text instead of overflowing', async () => {
    renderSellerDashboard();

    const link = await screen.findByRole('link', { name: /Pending Buy Requests|অপেক্ষমাণ ক্রয় অনুরোধ/i });
    const button = link.querySelector('button');
    const label = link.querySelector('span');
    expect(button).toBeTruthy();
    expect(button?.className).toContain('whitespace-normal');
    expect(label?.className).toContain('break-words');
    expect(link.className).toContain('min-w-0');
  });

  it('positions bulk FAB above cart summary when cart has items', async () => {
    navBadges.cart = 1;
    renderSellerDashboard();

    const fab = await screen.findByTestId('bulk-fab');
    expect(fab.className).toContain('shell-above-cart-summary');
    expect(fab.className).not.toContain('shell-above-bottom-nav');
  });

  it('positions bulk FAB above bottom nav when cart summary is hidden', async () => {
    renderSellerDashboard();

    const fab = await screen.findByTestId('bulk-fab');
    expect(fab.className).toContain('shell-above-bottom-nav');
    expect(fab.className).not.toContain('shell-above-cart-summary');
  });
});
