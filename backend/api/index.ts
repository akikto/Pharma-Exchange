import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Application } from 'express';

let app: Application | null = null;
let bootstrapError: Error | null = null;

function isRootRequest(req: VercelRequest): boolean {
  const url = req.url ?? '';
  return url === '' || url === '/' || url.startsWith('/?');
}

function sendLiveness(res: VercelResponse): void {
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

async function getApp(): Promise<Application> {
  if (bootstrapError) throw bootstrapError;
  if (app) return app;
  try {
    const { createApp } = await import('../src/app');
    app = createApp();
    return app;
  } catch (error) {
    bootstrapError = error instanceof Error ? error : new Error(String(error));
    throw bootstrapError;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (isRootRequest(req)) {
    sendLiveness(res);
    return;
  }

  try {
    const expressApp = await getApp();
    expressApp(req, res);
  } catch (error) {
    console.error('Serverless bootstrap failed:', error);
    res.status(500).json({
      error: 'Server bootstrap failed',
      message: error instanceof Error ? error.message : String(error),
      env: {
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        hasJwtSecret: Boolean(process.env.JWT_SECRET),
        nodeEnv: process.env.NODE_ENV,
        otpDevMode: process.env.OTP_DEV_MODE,
      },
    });
  }
}
