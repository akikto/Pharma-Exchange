import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { AdminSellersPage } from '@/features/admin/admin-sellers-page';

const apiGet = vi.fn();
const apiPatch = vi.fn();
const apiPost = vi.fn();

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGet(...args),
    patch: (...args: unknown[]) => apiPatch(...args),
    post: (...args: unknown[]) => apiPost(...args),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/components/layout/top-bar', () => ({
  TopBar: ({ title }: { title: string }) => <div>{title}</div>,
}));

const sampleSeller = {
  id: 'pharm-1',
  name: 'City Pharmacy',
  city: 'Dhaka',
  district: 'Dhaka',
  licenseNumber: 'LIC-001',
  verificationStatus: 'PENDING' as const,
  isActive: true,
  rating: 4.5,
  createdAt: new Date().toISOString(),
  listingCount: 3,
  owner: { id: 'u1', email: 'seller@pharmex.bd', phone: '+880', name: 'Seller User' },
};

function renderPage(initialPath = '/admin/sellers') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <AdminSellersPage />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('AdminSellersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockImplementation((path: string) => {
      if (path.startsWith('/admin/pharmacies?')) {
        return Promise.resolve({ data: [sampleSeller], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } });
      }
      if (path === '/admin/pharmacies/pharm-1') {
        return Promise.resolve({
          ...sampleSeller,
          address: '123 Main St',
          postalCode: '1200',
          rejectionReason: null,
          description: null,
          documents: [],
          activeListingCount: 2,
          orderCount: 0,
          buyRequestCount: 0,
          reviewCount: 0,
          canPermanentlyDelete: true,
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renders seller table with pending status', async () => {
    renderPage();
    expect(await screen.findByTestId('admin-sellers-table')).toBeInTheDocument();
    expect(screen.getByText('City Pharmacy')).toBeInTheDocument();
    expect(screen.getByTestId('admin-seller-row-pharm-1')).toHaveTextContent('Pending');
  });

  it('shows total seller count', async () => {
    renderPage();
    const el = await screen.findByTestId('admin-sellers-total-count');
    expect(el.textContent).toMatch(/1/);
    expect(el.textContent?.toLowerCase()).toContain('seller');
  });

  it('opens manage dialog with approve actions for pending seller', async () => {
    renderPage();
    fireEvent.click(await screen.findByTestId('admin-seller-manage-pharm-1'));
    expect(await screen.findByTestId('admin-seller-detail-dialog')).toBeInTheDocument();
    expect(await screen.findByTestId('admin-seller-approve')).toBeInTheDocument();
    expect(screen.getByTestId('admin-seller-reject')).toBeInTheDocument();
    expect(screen.getByTestId('admin-seller-delete-open')).toBeInTheDocument();
  });
});
