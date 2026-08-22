import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { env, isRazorpayConfigured, getFirebaseStorageDiagnostics } from '../../config/env';
import { getFirebaseStorage } from '../../config/firebase';

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
  const firebase = getFirebaseStorageDiagnostics();
  const firebaseAdminStorageAvailable = Boolean(getFirebaseStorage());
  const payload = {
    status: 'ok' as const,
    service: 'pharma-exchange-api',
    version: '1.0.0',
    database: 'connected' as const,
    payments,
    firebase,
    firebaseAdminStorageAvailable,
    deployment: {
      vercelEnv: process.env.VERCEL_ENV ?? null,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    },
    timestamp: new Date().toISOString(),
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json(payload);
  } catch {
    res.status(503).json({
      ...payload,
      status: 'degraded',
      database: 'disconnected',
    });
  }
});

export default router;
