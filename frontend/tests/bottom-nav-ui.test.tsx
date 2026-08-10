import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { BottomNav } from '@/components/layout/bottom-nav';

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: (state: { mode: string }) => unknown) => {
    const state = { mode: 'buyer' as const };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/hooks/use-nav-badges', () => ({
  useNavBadges: () => ({ cart: 0, chat: 0, requests: 0, watchlist: 0 }),
}));

function renderBottomNav(initialPath = '/') {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialPath]}>
        <BottomNav />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('BottomNav color hierarchy', () => {
  it('uses brand teal for the active tab and neutral gray for inactive tabs', () => {
    renderBottomNav('/');

    const homeLink = screen.getByTestId('nav-bottom-home');
    expect(homeLink.className).toContain('text-primary');

    const cartLink = screen.getByTestId('nav-bottom-cart');
    expect(cartLink.className).toContain('text-text-disabled');
    expect(cartLink.className).not.toContain('text-primary');
  });
});
