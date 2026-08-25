import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListingStatus } from '@prisma/client';
import { ACTIVE_LISTING_CAP_MESSAGE, MAX_ACTIVE_LISTINGS_PER_PHARMACY } from '../src/modules/listing/listing.constants';

const pharmacyId = 'pharmacy-test-id';
const userId = 'user-test-id';

const listingFindFirst = vi.fn();
const listingCount = vi.fn();
const listingUpdate = vi.fn();
const listingCreate = vi.fn();
const queryRaw = vi.fn();

function createTxClient() {
  return {
    listing: {
      findFirst: (...args: unknown[]) => listingFindFirst(...args),
      count: (...args: unknown[]) => listingCount(...args),
      update: (...args: unknown[]) => listingUpdate(...args),
      create: (...args: unknown[]) => listingCreate(...args),
    },
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
  };
}

vi.mock('../src/config/database', () => ({
  default: {
    listing: {
      findFirst: (...args: unknown[]) => listingFindFirst(...args),
      count: (...args: unknown[]) => listingCount(...args),
      update: (...args: unknown[]) => listingUpdate(...args),
      create: (...args: unknown[]) => listingCreate(...args),
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
import prisma from '../src/config/database';

describe('active listing cap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRaw.mockResolvedValue([{ id: pharmacyId }]);
    listingUpdate.mockResolvedValue({ id: 'listing-1', status: ListingStatus.ACTIVE });
    listingCreate.mockResolvedValue({ id: 'new', status: ListingStatus.ACTIVE, medicine: {} });
  });

  it('uses a cap of 50 active listings', () => {
    expect(MAX_ACTIVE_LISTINGS_PER_PHARMACY).toBe(50);
    expect(ACTIVE_LISTING_CAP_MESSAGE).toContain('50');
  });

  it('allows the 50th active listing when 49 are already active', async () => {
    listingCount.mockResolvedValue(MAX_ACTIVE_LISTINGS_PER_PHARMACY - 1);

    await listingService.create(userId, {
      medicineId: 'med-1',
      batchNumber: 'B1',
      mfgDate: '2025-01-01',
      expiryDate: '2027-01-01',
      purchasePrice: 10,
      sellingPrice: 12,
      availableQty: 5,
      status: ListingStatus.ACTIVE,
    });

    expect(listingCreate).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rejects the 51st active listing on create', async () => {
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

  it('rejects restock reactivation when pharmacy is at cap', async () => {
    listingFindFirst.mockResolvedValue({
      id: 'listing-sold',
      pharmacyId,
      status: ListingStatus.SOLD_OUT,
      availableQty: 0,
    });
    listingCount.mockResolvedValue(MAX_ACTIVE_LISTINGS_PER_PHARMACY);

    await expect(listingService.restock(userId, 'listing-sold')).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(listingUpdate).not.toHaveBeenCalled();
  });

  it('allows restock reactivation when below cap', async () => {
    listingFindFirst.mockResolvedValue({
      id: 'listing-sold',
      pharmacyId,
      status: ListingStatus.SOLD_OUT,
      availableQty: 0,
    });
    listingCount.mockResolvedValue(MAX_ACTIVE_LISTINGS_PER_PHARMACY - 1);
    listingUpdate.mockResolvedValue({
      id: 'listing-sold',
      status: ListingStatus.ACTIVE,
      medicine: {},
    });

    await listingService.restock(userId, 'listing-sold');
    expect(listingUpdate).toHaveBeenCalled();
  });

  it('does not count paused listings toward the cap when reactivating another listing', async () => {
    listingFindFirst.mockResolvedValue({
      id: 'listing-paused',
      pharmacyId,
      status: ListingStatus.PAUSED,
    });
    listingCount.mockResolvedValue(MAX_ACTIVE_LISTINGS_PER_PHARMACY - 1);

    await listingService.activate(userId, 'listing-paused');
    expect(listingCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: ListingStatus.ACTIVE,
          id: { not: 'listing-paused' },
        }),
      }),
    );
  });

  it('rejects update transition to ACTIVE when pharmacy is at cap', async () => {
    listingFindFirst.mockResolvedValue({
      id: 'listing-paused',
      pharmacyId,
      status: ListingStatus.PAUSED,
      sellingPrice: 10,
      discountPercent: 0,
    });
    listingCount.mockResolvedValue(MAX_ACTIVE_LISTINGS_PER_PHARMACY);

    await expect(
      listingService.update(userId, 'listing-paused', { status: ListingStatus.ACTIVE }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(listingUpdate).not.toHaveBeenCalled();
  });

  it('skips cap check for draft creates', async () => {
    await listingService.create(userId, {
      medicineId: 'med-1',
      batchNumber: 'B1',
      mfgDate: '2025-01-01',
      expiryDate: '2027-01-01',
      purchasePrice: 10,
      sellingPrice: 12,
      availableQty: 5,
      status: ListingStatus.DRAFT,
    });

    expect(listingCount).not.toHaveBeenCalled();
    expect(listingCreate).toHaveBeenCalled();
  });
});
