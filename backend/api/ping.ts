import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Lightweight liveness probe — no Prisma/Express bootstrap */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    service: 'pharma-exchange-api',
    runtime: 'vercel-serverless',
    env: {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasJwtSecret: Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16),
      nodeEnv: process.env.NODE_ENV ?? 'unset',
      otpDevMode: process.env.OTP_DEV_MODE ?? 'unset',
    },
  });
}
