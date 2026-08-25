import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListingStatus } from '@prisma/client';

const pharmacyId = 'pharmacy-1';
const userId = 'user-1';
const medicineId = '550e8400-e29b-41d4-a716-446655440000';

const listingCreate = vi.fn();

vi.mock('../src/config/database', () => ({
  default: {
    listing: {
      create: (...args: unknown[]) => listingCreate(...args),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../src/shared/middleware/pharmacy.middleware', () => ({
  getPharmacyForUser: vi.fn(async () => ({ id: pharmacyId })),
}));

vi.mock('../src/modules/watchlist/priceAlert.service', () => ({
  priceAlertService: { evaluateListing: vi.fn() },
}));

import { listingService } from '../src/modules/listing/listing.service';

describe('seller listing imageUrl restrictions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
