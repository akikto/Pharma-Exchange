import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { OrderDetailPage } from '@/features/buyer/order-detail-page';

const get = vi.fn();
const patch = vi.fn();

vi.mock('@/components/layout/top-bar', () => ({
  TopBar: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/hooks/use-page-role', () => ({
  usePageRole: () => 'buyer',
}));

vi.mock('@/hooks/use-payment-config', () => ({
  usePaymentConfig: () => ({ data: { provider: 'RAZORPAY', enabled: false } }),
}));

vi.mock('@/components/payments/pay-with-razorpay-button', () => ({
  PayWithRazorpayButton: () => <button type="button" data-testid="pay-with-razorpay-button">Pay now</button>,
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    apiClient: {
      get: (...args: unknown[]) => get(...args),
      patch: (...args: unknown[]) => patch(...args),
      post: vi.fn(),
      delete: vi.fn(),
      getText: vi.fn(),
      upload: vi.fn(),
    },
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const orderId = '550e8400-e29b-41d4-a716-446655440001';

const pendingOrder = {
  id: orderId,
  orderNumber: 'ORD-2026-000001',
  status: 'CONFIRMED',
  paymentStatus: 'PENDING',
  paymentMethod: null,
  totalAmount: '1280',
  createdAt: '2026-08-07T00:00:00.000Z',
  buyer: { id: 'buyer-1', firstName: 'Rahim', lastName: 'Hossain', email: 'buyer@pharmex.bd' },
  seller: { id: 'pharmacy-1', name: 'City Pharmacy', city: 'Dhaka', userId: 'seller-1' },
  items: [{
    id: 'item-1',
    listingId: 'listing-1',
    medicineName: 'Ace Plus',
    quantity: 10,
    unitPrice: '128',
    subtotal: '1280',
  }],
};

function renderOrderDetailPage(order = pendingOrder) {
  void i18n.changeLanguage('en');
  get.mockImplementation(async (url: string) => {
    if (url === `/orders/${orderId}`) return order;
    if (url === `/payments/order/${orderId}`) return { data: [] };
    throw new Error(`Unexpected GET ${url}`);
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
          <Routes>
            <Route path="/orders/:id" element={<OrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('OrderDetailPage COD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patch.mockResolvedValue({ ...pendingOrder, paymentMethod: 'COD' });
  });

  it('shows COD selector when Razorpay is disabled and hides Pay Now', async () => {
    renderOrderDetailPage();

    expect(await screen.findByTestId('payment-method-selector')).toBeInTheDocument();
    expect(screen.getByTestId('payment-method-cod')).toBeInTheDocument();
    expect(screen.queryByTestId('payment-method-razorpay')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pay-with-razorpay-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('payment-unavailable-notice')).not.toBeInTheDocument();
  });

  it('shows COD notice and no Pay Now after COD is selected', async () => {
    renderOrderDetailPage({ ...pendingOrder, paymentMethod: 'COD' });

    expect(await screen.findByTestId('cod-payment-notice')).toBeInTheDocument();
    expect(screen.queryByTestId('pay-with-razorpay-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('payment-method-selector')).not.toBeInTheDocument();
  });

  it('selects COD via payment-method API', async () => {
    renderOrderDetailPage();

    fireEvent.click(await screen.findByTestId('payment-method-cod'));

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith(`/orders/${orderId}/payment-method`, { method: 'COD' });
    });
  });
});
