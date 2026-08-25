import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListingStatus } from '@prisma/client';

const pharmacyId = 'pharmacy-1';
const userId = 'user-1';
const medicineId = '550e8400-e29b-41d4-a716-446655440000';

const listingCreate = vi.fn();
const listingFindFirst = vi.fn();
const listingUpdate = vi.fn();
const listingCount = vi.fn();
const pharmacyFindUnique = vi.fn();
const executeRaw = vi.fn();

function createTxClient() {
  return {
    listing: {
      create: (...args: unknown[]) => listingCreate(...args),
      findFirst: (...args: unknown[]) => listingFindFirst(...args),
      update: (...args: unknown[]) => listingUpdate(...args),
      count: (...args: unknown[]) => listingCount(...args),
    },
    pharmacy: {
      findUnique: (...args: unknown[]) => pharmacyFindUnique(...args),
    },
    $executeRaw: (...args: unknown[]) => executeRaw(...args),
  };
}

vi.mock('../src/config/database', () => ({
  default: {
    listing: {
      create: (...args: unknown[]) => listingCreate(...args),
      findFirst: (...args: unknown[]) => listingFindFirst(...args),
      update: (...args: unknown[]) => listingUpdate(...args),
      count: (...args: unknown[]) => listingCount(...args),
    },
    $transaction: vi.fn(async (fn: (tx: ReturnType<typeof createTxClient>) => Promise<unknown>) => fn(createTxClient())),
  },
}));

vi.mock('../src/shared/middleware/pharmacy.middleware', () => ({
  getPharmacyForUser: vi.fn(async () => ({ id: pharmacyId })),
}));

vi.mock('../src/modules/watchlist/priceAlert.service', () => ({
  priceAlertService: { evaluateListing: vi.fn(() => Promise.resolve()) },
}));

import { listingService } from '../src/modules/listing/listing.service';

describe('seller listing imageUrl restrictions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRaw.mockResolvedValue([{ id: pharmacyId }]);
    listingCreate.mockResolvedValue({
      id: 'listing-1',
      status: ListingStatus.DRAFT,
      imageUrl: null,
      medicine: {},
    });
  });

  it('ignores seller-provided imageUrl on create', async () => {
    await listingService.create(userId, {
      medicineId,
      batchNumber: 'B1',
      mfgDate: '2025-01-01T00:00:00.000Z',
      expiryDate: '2027-01-01T00:00:00.000Z',
      purchasePrice: 10,
      sellingPrice: 12,
      availableQty: 5,
      status: ListingStatus.DRAFT,
      imageUrl: 'https://evil.example.com/custom.jpg',
    });

    expect(listingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          imageUrl: 'https://evil.example.com/custom.jpg',
        }),
      }),
    );
    const createArg = listingCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(createArg.data.imageUrl).toBeUndefined();
  });

  it('ignores seller-provided imageUrl on update', async () => {
    listingFindFirst.mockResolvedValue({
      id: 'listing-1',
      pharmacyId,
      sellingPrice: 12,
      discountPercent: 0,
      status: ListingStatus.ACTIVE,
    });
    listingUpdate.mockResolvedValue({ id: 'listing-1', status: ListingStatus.ACTIVE, medicine: {} });

    await listingService.update(userId, 'listing-1', {
      imageUrl: 'https://evil.example.com/custom.jpg',
      sellingPrice: 15,
    });

    expect(listingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          imageUrl: 'https://evil.example.com/custom.jpg',
        }),
      }),
    );
  });
});
