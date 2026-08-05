import { z } from 'zod';

export const broadcastSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  userIds: z.array(z.string().uuid()).max(500).optional(),
  data: z.record(z.string()).optional(),
});
