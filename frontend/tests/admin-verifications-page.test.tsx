import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { AdminVerificationsPage } from '@/features/admin/admin-dashboard-page';

const apiGet = vi.fn();

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGet(...args),
    patch: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

vi.mock('@/components/layout/top-bar', () => ({
  TopBar: ({ title, backTo }: { title: string; backTo?: string }) => (
    <div data-testid="top-bar" data-back-to={backTo ?? ''}>
      {title}
    </div>
  ),
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

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/verifications']}>
          <AdminVerificationsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('AdminVerificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockImplementation((path: string) => {
      if (path.startsWith('/admin/pharmacies?')) {
        return Promise.resolve({
          data: [sampleSeller],
          pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renders verification queue instead of redirecting away', async () => {
    renderPage();
    expect(await screen.findByTestId('admin-verifications-page')).toBeInTheDocument();
    expect(screen.getByText('Verification queue')).toBeInTheDocument();
    expect(screen.getByTestId('admin-sellers-table')).toBeInTheDocument();
    expect(screen.getByTestId('top-bar')).toHaveAttribute('data-back-to', '/admin');
  });

  it('requests pending pharmacies by default', async () => {
    renderPage();
    await screen.findByTestId('admin-sellers-table');
    const listCall = apiGet.mock.calls.find((call) => String(call[0]).startsWith('/admin/pharmacies?'));
    expect(listCall).toBeTruthy();
    expect(String(listCall?.[0])).toContain('verificationStatus=PENDING');
  });

  it('opens manage dialog with approve and reject', async () => {
    renderPage();
    fireEvent.click(await screen.findByTestId('admin-seller-manage-pharm-1'));
    expect(await screen.findByTestId('admin-seller-detail-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('admin-seller-approve')).toBeInTheDocument();
    expect(screen.getByTestId('admin-seller-reject')).toBeInTheDocument();
  });
});
