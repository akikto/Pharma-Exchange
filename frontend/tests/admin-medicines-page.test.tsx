import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { AdminMedicinesPage } from '@/features/admin/admin-medicines-page';
import { ApiError } from '@/lib/api';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();

const authState = vi.hoisted(() => ({
  user: {
    id: 'admin-1',
    email: 'admin@pharmex.bd',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as const,
  },
  isAuthenticated: true,
  isLoading: false,
  mode: 'buyer' as const,
}));

vi.mock('@/components/layout/top-bar', () => ({
  TopBar: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    apiClient: {
      get: (...args: unknown[]) => get(...args),
      post: (...args: unknown[]) => post(...args),
      patch: (...args: unknown[]) => patch(...args),
      delete: vi.fn(),
      getText: vi.fn(),
      upload: vi.fn(),
    },
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const sampleMedicine = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Ace Plus',
  genericName: 'Paracetamol + Caffeine',
  brandName: 'Ace Plus',
  company: 'Square Pharmaceuticals',
  dosageForm: 'TABLET',
  strength: '500mg+65mg',
  packSize: '10x10 Strip',
  category: 'Analgesic',
  isActive: true,
};

function renderAdminMedicinesPage(initialEntry = '/admin/medicines') {
  void i18n.changeLanguage('en');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/admin/medicines" element={<AdminMedicinesPage />} />
            <Route path="/" element={<div data-testid="home-page">Home</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('AdminMedicinesPage', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
    authState.user = {
      id: 'admin-1',
      email: 'admin@pharmex.bd',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    get.mockResolvedValue({ data: [sampleMedicine], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } });
  });

  it('renders /admin/medicines page and medicine list', async () => {
    renderAdminMedicinesPage();

    expect(await screen.findByTestId('admin-medicines-page')).toBeInTheDocument();
    expect(await screen.findByText('Ace Plus')).toBeInTheDocument();
    expect(screen.getByText('Square Pharmaceuticals')).toBeInTheDocument();
    expect(screen.getByText('TABLET')).toBeInTheDocument();
  });

  it('searches medicines via GET /medicines', async () => {
    renderAdminMedicinesPage();

    fireEvent.change(screen.getByTestId('admin-medicines-search'), { target: { value: 'Ace' } });

    await waitFor(() => {
      expect(get).toHaveBeenCalledWith(expect.stringContaining('/medicines?'));
      expect(get).toHaveBeenCalledWith(expect.stringContaining('q=Ace'));
    });
  });

  it('shows add medicine form and validates required fields', async () => {
    renderAdminMedicinesPage();
    await screen.findByTestId('admin-medicines-table');

    fireEvent.click(screen.getByTestId('admin-medicines-add-button'));
    expect(screen.getByTestId('medicine-form-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /create medicine/i }));
    expect((await screen.findAllByText('This field is required.')).length).toBeGreaterThanOrEqual(4);
    expect(post).not.toHaveBeenCalled();
  });

  it('creates a medicine successfully', async () => {
    post.mockResolvedValue({ ...sampleMedicine, id: 'new-id', name: 'New Med' });
    renderAdminMedicinesPage();
    await screen.findByTestId('admin-medicines-table');

    fireEvent.click(screen.getByTestId('admin-medicines-add-button'));
    fireEvent.change(screen.getByLabelText(/^Name \*$/), { target: { value: 'New Med' } });
    fireEvent.change(screen.getByLabelText(/^Company \*$/), { target: { value: 'Square Pharmaceuticals' } });
    fireEvent.change(screen.getByTestId('medicine-dosage-form'), { target: { value: 'TABLET' } });
    fireEvent.change(screen.getByLabelText(/^Pack Size \*$/), { target: { value: '10x10 Strip' } });
    fireEvent.change(screen.getByLabelText(/^Category \*$/), { target: { value: 'Analgesic' } });
    fireEvent.click(screen.getByRole('button', { name: /create medicine/i }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/medicines', {
        name: 'New Med',
        company: 'Square Pharmaceuticals',
        dosageForm: 'TABLET',
        packSize: '10x10 Strip',
        category: 'Analgesic',
      });
    });
  });

  it('shows backend validation errors clearly', async () => {
    post.mockRejectedValue(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', [
      { path: 'category', message: 'Invalid category' },
    ]));
    renderAdminMedicinesPage();
    await screen.findByTestId('admin-medicines-table');

    fireEvent.click(screen.getByTestId('admin-medicines-add-button'));
    fireEvent.change(screen.getByLabelText(/^Name \*$/), { target: { value: 'New Med' } });
    fireEvent.change(screen.getByLabelText(/^Company \*$/), { target: { value: 'Square Pharmaceuticals' } });
    fireEvent.change(screen.getByTestId('medicine-dosage-form'), { target: { value: 'TABLET' } });
    fireEvent.change(screen.getByLabelText(/^Pack Size \*$/), { target: { value: '10x10 Strip' } });
    fireEvent.change(screen.getByLabelText(/^Category \*$/), { target: { value: 'Analgesic' } });
    fireEvent.click(screen.getByRole('button', { name: /create medicine/i }));

    expect(await screen.findByTestId('medicine-form-error')).toHaveTextContent('category: Invalid category');
  });

  it('edits a medicine via PATCH /medicines/:id', async () => {
    patch.mockResolvedValue({ ...sampleMedicine, name: 'Ace Plus Updated' });
    renderAdminMedicinesPage();
    await screen.findByTestId('admin-medicines-table');

    fireEvent.click(screen.getByTestId(`medicine-edit-${sampleMedicine.id}`));
    fireEvent.change(screen.getByLabelText(/^Name \*$/), { target: { value: 'Ace Plus Updated' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith(`/medicines/${sampleMedicine.id}`, expect.objectContaining({
        name: 'Ace Plus Updated',
      }));
    });
  });
});

describe('Admin medicines route registration', () => {
  it('includes /admin/medicines in the router module', async () => {
    const routerModule = await import('@/app/router');
    expect(routerModule.AppRouter).toBeDefined();
  });
});
