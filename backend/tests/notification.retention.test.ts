import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NOTIFICATION_RETENTION_DAYS } from '../src/modules/notification/notification.retention.constants';

const deleteMany = vi.fn();

vi.mock('../src/config/database', () => ({
  default: {
    notification: {
      deleteMany: (...args: unknown[]) => deleteMany(...args),
    },
  },
}));

import { runNotificationRetentionCleanup } from '../src/modules/notification/notification.retention.service';

describe('notification retention cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteMany.mockResolvedValue({ count: 3 });
  });

  it('uses a 7-day retention window', () => {
    expect(NOTIFICATION_RETENTION_DAYS).toBe(7);
  });

  it('deletes notifications older than the retention cutoff', async () => {
    const now = new Date('2026-08-25T12:00:00.000Z');
    const deleted = await runNotificationRetentionCleanup(now);

    expect(deleted).toBe(3);
    expect(deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: new Date('2026-08-18T12:00:00.000Z') } },
    });
  });
});
