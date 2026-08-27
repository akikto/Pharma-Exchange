import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { ListingFormPage } from '@/features/seller/listing-form-page';
import { ApiError } from '@/lib/api';
import { MEDICINE_SELECTION_MESSAGE } from '@/lib/api-errors';

const post = vi.fn();
const get = vi.fn();
const navigate = vi.fn();

vi.mock('@/components/layout/top-bar', () => ({
  TopBar: ({ title }: { title: string }) => <div>{title}</div>,
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

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/components/medicine/medicine-name-autocomplete', () => ({
  MedicineNameAutocomplete: ({
    value,
    onValueChange,
    onMedicineSelect,
    inputTestId = 'medicine-search-input',
    resultsTestId = 'medicine-search-results',
  }: {
    value: string;
    onValueChange: (value: string) => void;
    onMedicineSelect: (medicine: { id: string; name: string; company: string }) => void;
    inputTestId?: string;
    resultsTestId?: string;
  }) => (
    <div>
      <input
        data-testid={inputTestId}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
      {value.length >= 2 && (
        <div data-testid={resultsTestId}>
          <button
            type="button"
            onClick={() => onMedicineSelect({
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Ace Plus',
              company: 'Square',
            })}
          >
            Ace Plus — Square
          </button>
        </div>
      )}
    </div>
  ),
}));

vi.mock('@/components/medicine/medicine-image-upload', () => ({
  MedicineImageUpload: () => <div data-testid="listing-image-upload" />,
}));

vi.mock('@/lib/listing-draft', () => ({
  loadListingDraft: vi.fn().mockResolvedValue(null),
  saveListingDraft: vi.fn(),
  clearListingDraft: vi.fn(),
  isListingDraftEmpty: vi.fn().mockReturnValue(true),
}));

function renderPage() {
  void i18n.changeLanguage('en');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/seller/listing/new']}>
          <ListingFormPage />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

function fillRequiredFields() {
  const dateInputs = document.querySelectorAll('input[type="date"]');
  const numberInputs = document.querySelectorAll('input[type="number"]');

  fireEvent.change(screen.getByTestId('medicine-search-input'), { target: { value: 'Ace' } });
  fireEvent.change(screen.getByLabelText('Batch Number'), { target: { value: 'Fr12' } });
  fireEvent.change(dateInputs[0], { target: { value: '2025-01-01' } });
  fireEvent.change(dateInputs[1], { target: { value: '2027-12-31' } });
  fireEvent.change(numberInputs[0], { target: { value: '25' } });
  fireEvent.change(numberInputs[1], { target: { value: '30' } });
  fireEvent.change(numberInputs[2], { target: { value: '20' } });
  fireEvent.change(numberInputs[3], { target: { value: '10' } });
  fireEvent.change(numberInputs[4], { target: { value: '1' } });
}

describe('ListingFormPage', () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
    navigate.mockReset();
    get.mockImplementation((path: string) => {
      if (typeof path === 'string' && path.startsWith('/medicines')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve([]);
    });
  });

  it('keeps Create Listing enabled when no medicine is selected', () => {
    renderPage();
    expect(screen.getByTestId('listing-delivery-mode-seller-delivers')).toBeChecked();
    expect(screen.getByRole('button', { name: /create listing/i })).toBeEnabled();
  });

  it('blocks submit when search text is entered without selecting a result', async () => {
    get.mockImplementation((path: string) => {
      if (typeof path === 'string' && path.startsWith('/medicines')) {
        return Promise.resolve({
          data: [{
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Ace Plus',
            company: 'Square',
          }],
        });
      }
      return Promise.resolve([]);
    });

    renderPage();
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByTestId('medicine-search-results')).toBeInTheDocument();
    });

    const submit = screen.getByRole('button', { name: /create listing/i });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(post).not.toHaveBeenCalled();
      expect(screen.getByTestId('listing-form-error')).toHaveTextContent(MEDICINE_SELECTION_MESSAGE);
      expect(screen.getByTestId('medicine-search-results')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ace plus/i })).toBeInTheDocument();
    });
  });

  it('submits with a selected medicine and omits empty lowStockThreshold', async () => {
    get.mockImplementation((path: string) => {
      if (typeof path === 'string' && path.startsWith('/medicines')) {
        return Promise.resolve({
          data: [{
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Ace Plus',
            company: 'Square',
          }],
        });
      }
      return Promise.resolve([]);
    });
    post.mockResolvedValue({ id: 'listing-1' });

    renderPage();
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ace plus/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /ace plus/i }));
    fireEvent.click(screen.getByRole('button', { name: /create listing/i }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledTimes(1);
    });

    const body = post.mock.calls[0][1];
    expect(body.medicineId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(body.lowStockThreshold).toBeUndefined();
    expect(body.purchasePrice).toBe(25);
    expect(body.sellingPrice).toBe(30);
    expect(body.deliveryMode).toBe('SELLER_DELIVERS');
  });

  it('shows friendly medicine message for backend validation errors', async () => {
    get.mockImplementation((path: string) => {
      if (typeof path === 'string' && path.startsWith('/medicines')) {
        return Promise.resolve({
          data: [{
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Ace Plus',
            company: 'Square',
          }],
        });
      }
      return Promise.resolve([]);
    });
    post.mockRejectedValue(
      new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', [
        { path: 'medicineId', message: 'Medicine selection is required.' },
      ]),
    );

    renderPage();
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ace plus/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /ace plus/i }));
    fireEvent.click(screen.getByRole('button', { name: /create listing/i }));

    await waitFor(() => {
      expect(screen.getByTestId('listing-form-error')).toHaveTextContent(MEDICINE_SELECTION_MESSAGE);
    });
  });
});
