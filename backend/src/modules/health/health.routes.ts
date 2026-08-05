import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { env, isRazorpayConfigured } from '../../config/env';

const router = Router();

function publicPaymentsConfig() {
  return {
    provider: 'RAZORPAY' as const,
    enabled: isRazorpayConfigured(),
    currency: env.RAZORPAY_CURRENCY,
  };
}

router.get('/', async (_req: Request, res: Response) => {
  const payments = publicPaymentsConfig();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'pharma-exchange-api',
      version: '1.0.0',
      database: 'connected',
      payments,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      service: 'pharma-exchange-api',
      version: '1.0.0',
      database: 'disconnected',
      payments,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
