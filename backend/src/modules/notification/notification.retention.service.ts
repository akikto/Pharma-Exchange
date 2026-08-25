import prisma from '../../config/database';
import { NOTIFICATION_RETENTION_DAYS } from './notification.retention.constants';

export async function runNotificationRetentionCleanup(now = new Date()): Promise<number> {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - NOTIFICATION_RETENTION_DAYS);

  const result = await prisma.notification.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return result.count;
}
