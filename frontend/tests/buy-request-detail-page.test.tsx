import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { BuyRequestDetailPage } from '@/features/buyer/buy-request-detail-page';
import { ApiError } from '@/lib/api';

const get = vi.fn();
const post = vi.fn();

vi.mock('@/components/layout/top-bar', () => ({
  TopBar: ({ title }: { title: string }) => <div>{title}</div>,
}));

const usePageRole = vi.fn(() => 'seller');

vi.mock('@/hooks/use-page-role', () => ({
  usePageRole: () => usePageRole(),
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    apiClient: {
      get: (...args: unknown[]) => get(...args),
      post: (...args: unknown[]) => post(...args),
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

const requestId = '550e8400-e29b-41d4-a716-446655440000';

const sampleBuyRequest = {
  id: requestId,
  requestNumber: 'BR-2026-000001',
  status: 'PENDING',
  totalAmount: '1280',
  createdAt: '2026-08-07T00:00:00.000Z',
  buyer: { id: 'buyer-1', firstName: 'Rahim', lastName: 'Hossain' },
  seller: { id: 'pharmacy-1', name: 'City Pharmacy', city: 'Dhaka', rating: 4.6, verificationStatus: 'APPROVED' },
  items: [{
    id: 'item-1',
    quantity: 10,
    unitPrice: '128',
    subtotal: '1280',
    listing: {
      id: 'listing-1',
      medicine: { id: 'med-1', name: 'Ace Plus' },
    },
  }],
};

function buttonShowsLoading(button: HTMLElement) {
  return button.querySelector('.animate-spin') !== null;
}

function renderBuyRequestDetailPage() {
  void i18n.changeLanguage('en');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/seller/requests/${requestId}`]}>
          <Routes>
            <Route path="/seller/requests/:id" element={<BuyRequestDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('BuyRequestDetailPage respond loading state', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    usePageRole.mockReturnValue('seller');
    get.mockResolvedValue(sampleBuyRequest);
  });

  it('shows loading only on Accept when Accept is tapped', async () => {
    let resolvePost: (value: unknown) => void = () => undefined;
    post.mockImplementation(() => new Promise((resolve) => {
      resolvePost = resolve;
    }));

    renderBuyRequestDetailPage();
    const acceptButton = await screen.findByTestId('buy-request-accept-button');
    const rejectButton = screen.getByTestId('buy-request-reject-button');

    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(buttonShowsLoading(acceptButton)).toBe(true);
      expect(buttonShowsLoading(rejectButton)).toBe(false);
    });

    resolvePost({ buyRequest: { ...sampleBuyRequest, status: 'ACCEPTED' } });

    await waitFor(() => {
      expect(buttonShowsLoading(acceptButton)).toBe(false);
      expect(buttonShowsLoading(rejectButton)).toBe(false);
    });
  });

  it('shows loading only on Reject when Reject is tapped', async () => {
    let resolvePost: (value: unknown) => void = () => undefined;
    post.mockImplementation(() => new Promise((resolve) => {
      resolvePost = resolve;
    }));

    renderBuyRequestDetailPage();
    const acceptButton = await screen.findByTestId('buy-request-accept-button');
    const rejectButton = screen.getByTestId('buy-request-reject-button');

    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(buttonShowsLoading(rejectButton)).toBe(true);
      expect(buttonShowsLoading(acceptButton)).toBe(false);
    });

    resolvePost({ buyRequest: { ...sampleBuyRequest, status: 'REJECTED' } });

    await waitFor(() => {
      expect(buttonShowsLoading(rejectButton)).toBe(false);
      expect(buttonShowsLoading(acceptButton)).toBe(false);
    });
  });

  it('clears loading after backend error', async () => {
    post.mockRejectedValue(new ApiError(500, 'Internal server error', 'INTERNAL_ERROR'));

    renderBuyRequestDetailPage();
    const acceptButton = await screen.findByTestId('buy-request-accept-button');
    const rejectButton = screen.getByTestId('buy-request-reject-button');

    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
      expect(buttonShowsLoading(acceptButton)).toBe(false);
      expect(buttonShowsLoading(rejectButton)).toBe(false);
    });
  });
});

describe('BuyRequestDetailPage expiry UI', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    usePageRole.mockReturnValue('buyer');
  });

  it('hides seller actions and shows resend when expired', async () => {
    get.mockResolvedValue({
      ...sampleBuyRequest,
      status: 'EXPIRED',
      expiresAt: '2020-01-01T00:00:00.000Z',
    });

    renderBuyRequestDetailPage();

    await screen.findByTestId('buy-request-expired-banner');
    expect(screen.queryByTestId('buy-request-accept-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('buy-request-resend-button')).toBeInTheDocument();
  });
});
