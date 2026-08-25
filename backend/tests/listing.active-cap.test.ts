import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListingStatus } from '@prisma/client';
import { ACTIVE_LISTING_CAP_MESSAGE, MAX_ACTIVE_LISTINGS_PER_PHARMACY } from '../src/modules/listing/listing.constants';

const pharmacyId = 'pharmacy-test-id';
const userId = 'user-test-id';

const listingFindFirst = vi.fn();
const listingCount = vi.fn();
const listingUpdate = vi.fn();
const listingCreate = vi.fn();

vi.mock('../src/config/database', () => ({
  default: {
    listing: {
      findFirst: (...args: unknown[]) => listingFindFirst(...args),
      count: (...args: unknown[]) => listingCount(...args),
      update: (...args: unknown[]) => listingUpdate(...args),
      create: (...args: unknown[]) => listingCreate(...args),
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

describe('active listing cap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listingUpdate.mockResolvedValue({ id: 'listing-1', status: ListingStatus.ACTIVE });
    listingCreate.mockResolvedValue({ id: 'new', status: ListingStatus.ACTIVE, medicine: {} });
  });

  it('uses a cap of 50 active listings', () => {
    expect(MAX_ACTIVE_LISTINGS_PER_PHARMACY).toBe(50);
    expect(ACTIVE_LISTING_CAP_MESSAGE).toContain('50');
  });

  it('rejects activate when pharmacy is at cap', async () => {
    listingFindFirst.mockResolvedValue({
      id: 'listing-paused',
      pharmacyId,
      status: ListingStatus.PAUSED,
    });
    listingCount.mockResolvedValue(MAX_ACTIVE_LISTINGS_PER_PHARMACY);

    await expect(listingService.activate(userId, 'listing-paused')).rejects.toMatchObject({
      statusCode: 409,
      message: ACTIVE_LISTING_CAP_MESSAGE,
    });
    expect(listingUpdate).not.toHaveBeenCalled();
  });

  it('rejects create with ACTIVE when pharmacy is at cap', async () => {
    listingCount.mockResolvedValue(MAX_ACTIVE_LISTINGS_PER_PHARMACY);

    await expect(
      listingService.create(userId, {
        medicineId: 'med-1',
        batchNumber: 'B1',
        mfgDate: '2025-01-01',
        expiryDate: '2027-01-01',
        purchasePrice: 10,
        sellingPrice: 12,
        availableQty: 5,
        status: ListingStatus.ACTIVE,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: ACTIVE_LISTING_CAP_MESSAGE,
    });
    expect(listingCreate).not.toHaveBeenCalled();
  });
});
