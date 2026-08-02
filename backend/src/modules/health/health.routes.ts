import { Router, Request, Response } from 'express';
import prisma from '../../config/database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'pharma-exchange-api',
      version: '1.0.0',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      service: 'pharma-exchange-api',
      version: '1.0.0',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
