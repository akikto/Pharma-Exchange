import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app';

let app: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!app) app = createApp();
  return app;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return getApp()(req, res);
  } catch (error) {
    console.error('Serverless bootstrap failed:', error);
    res.status(500).json({
      error: 'Server bootstrap failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
