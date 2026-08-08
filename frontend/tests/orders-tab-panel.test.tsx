import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { OrdersTabPanel } from '@/components/orders/orders-tab-panel';

const get = vi.fn();

vi.mock('@/hooks/use-hub-role', () => ({
  useHubRole: () => 'buyer',
}));

vi.mock('@/hooks/use-payment-config', () => ({
  usePaymentConfig: () => ({ data: { enabled: false } }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    apiClient: {
      get: (...args: unknown[]) => get(...args),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      getText: vi.fn(),
      upload: vi.fn(),
    },
  };
});

const orderUuid = '550e8400-e29b-41d4-a716-446655440001';

const sampleOrders = {
  data: [{
    id: orderUuid,
    orderNumber: 'ORD-2026-183894',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    totalAmount: '1280',
    createdAt: '2026-08-07T00:00:00.000Z',
    seller: { id: 'pharmacy-1', name: 'City Pharmacy', city: 'Dhaka' },
    items: [{ id: 'item-1', medicineName: 'Ace Plus', quantity: 10, unitPrice: '128', subtotal: '1280' }],
  }],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

function renderOrdersTabPanel() {
  void i18n.changeLanguage('en');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/cart?tab=orders']}>
          <OrdersTabPanel />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('OrdersTabPanel order links', () => {
  beforeEach(() => {
    get.mockReset();
    get.mockImplementation(async (url: string) => {
      if (url === '/orders?role=buyer') return sampleOrders;
      throw new Error(`Unexpected GET ${url}`);
    });
  });

  it('links to order detail using UUID, not orderNumber', async () => {
    renderOrdersTabPanel();

    const link = await screen.findByRole('link', { name: /ORD-2026-183894/i });
    expect(link).toHaveAttribute('href', `/orders/${orderUuid}`);
    expect(link.getAttribute('href')).not.toContain('ORD-2026-183894');
  });
});
