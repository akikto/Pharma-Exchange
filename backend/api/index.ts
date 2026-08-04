import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Application } from 'express';

let app: Application | null = null;
let bootstrapError: Error | null = null;

/** Paths that must respond without bootstrapping Express/Prisma on Vercel. */
const LIVENESS_PATHS = new Set(['/', '/health', '/api', '/api/']);

function requestPath(req: VercelRequest): string {
  const raw = req.url ?? '';
  const path = raw.split('?')[0] ?? '';
  return path || '/';
}

function isLivenessRequest(req: VercelRequest): boolean {
  return LIVENESS_PATHS.has(requestPath(req));
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
      msg91Enabled: process.env.MSG91_ENABLED === 'true',
      msg91Configured: Boolean(
        process.env.MSG91_ENABLED === 'true' &&
        process.env.MSG91_AUTH_KEY &&
        process.env.MSG91_SENDER_ID &&
        process.env.MSG91_TEMPLATE_ID,
      ),
      razorpayEnabled: process.env.RAZORPAY_ENABLED === 'true',
      razorpayConfigured: Boolean(
        process.env.RAZORPAY_ENABLED === 'true' &&
        process.env.RAZORPAY_KEY_ID &&
        process.env.RAZORPAY_KEY_SECRET &&
        process.env.RAZORPAY_WEBHOOK_SECRET,
      ),
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
  if (isLivenessRequest(req)) {
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
        msg91Enabled: process.env.MSG91_ENABLED === 'true',
        razorpayEnabled: process.env.RAZORPAY_ENABLED === 'true',
      },
    });
  }
}
