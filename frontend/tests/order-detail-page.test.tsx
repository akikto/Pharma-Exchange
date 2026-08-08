import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { OrderDetailPage } from '@/features/buyer/order-detail-page';

const get = vi.fn();

vi.mock('@/components/layout/top-bar', () => ({
  TopBar: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/hooks/use-page-role', () => ({
  usePageRole: vi.fn(() => 'seller'),
}));

vi.mock('@/hooks/use-payment-config', () => ({
  usePaymentConfig: () => ({ data: { provider: 'RAZORPAY', enabled: true, currency: 'INR' } }),
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
      post: vi.fn(),
      patch: vi.fn(),
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

const sampleOrder = {
  id: orderId,
  orderNumber: 'ORD-2026-000001',
  status: 'CONFIRMED',
  paymentStatus: 'PENDING',
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

function renderOrderDetailPage(path = `/seller/orders/${orderId}`) {
  void i18n.changeLanguage('en');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/seller/orders/:id" element={<OrderDetailPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('OrderDetailPage payment fulfillment UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockImplementation(async (url: string) => {
      if (url === `/orders/${orderId}`) return sampleOrder;
      if (url === `/payments/order/${orderId}`) return { data: [] };
      if (url === '/health') return { payments: { provider: 'RAZORPAY', enabled: true, currency: 'INR' } };
      throw new Error(`Unexpected GET ${url}`);
    });
  });

  it('disables seller fulfillment when payment is still pending', async () => {
    const { usePageRole } = await import('@/hooks/use-page-role');
    vi.mocked(usePageRole).mockReturnValue('seller');

    renderOrderDetailPage();

    const button = await screen.findByTestId('seller-fulfillment-button');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('seller-awaiting-payment-notice')).toBeInTheDocument();
    expect(screen.getByText('No payment attempts yet')).toBeInTheDocument();
  });

  it('shows pay button for buyer on unpaid confirmed orders', async () => {
    const { usePageRole } = await import('@/hooks/use-page-role');
    vi.mocked(usePageRole).mockReturnValue('buyer');

    renderOrderDetailPage(`/orders/${orderId}`);

    expect(await screen.findByTestId('pay-with-razorpay-button')).toBeInTheDocument();
    expect(screen.getByText('Complete payment to allow the seller to pack and ship this order.')).toBeInTheDocument();
  });
});
