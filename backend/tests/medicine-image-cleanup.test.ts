import { describe, expect, it, vi, beforeEach } from 'vitest';
import { medicineService } from '../src/modules/medicine/medicine.service';
import { storageService } from '../src/modules/upload/storage.service';
import prisma from '../src/config/database';

vi.mock('../src/config/database', () => ({
  default: {
    medicine: {
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    listing: {
      count: vi.fn(),
    },
  },
}));

vi.mock('../src/modules/upload/storage.service', () => ({
  storageService: {
    deleteFile: vi.fn(),
  },
}));

describe('medicine image cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not delete images that are still referenced', async () => {
    vi.mocked(prisma.medicine.count).mockResolvedValue(1);
    vi.mocked(prisma.listing.count).mockResolvedValue(0);

    await medicineService.cleanupImageIfUnreferenced('https://storage.example.com/public/medicines/a.webp');

    expect(storageService.deleteFile).not.toHaveBeenCalled();
  });

  it('deletes unreferenced images safely', async () => {
    vi.mocked(prisma.medicine.count).mockResolvedValue(0);
    vi.mocked(prisma.listing.count).mockResolvedValue(0);

    await medicineService.cleanupImageIfUnreferenced('https://storage.example.com/public/medicines/a.webp');

    expect(storageService.deleteFile).toHaveBeenCalledWith('https://storage.example.com/public/medicines/a.webp');
  });
});
