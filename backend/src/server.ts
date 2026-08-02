import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { initializeSocket } from './socket';
import { startBackgroundJobs } from './jobs';
import prisma from './config/database';

const app = createApp();
const httpServer = createServer(app);

initializeSocket(httpServer);
startBackgroundJobs();

const server = httpServer.listen(env.PORT, () => {
  logger.info(`PharmEx API v1.0.0 running on port ${env.PORT}`);
  if (env.NODE_ENV !== 'production') {
    logger.info(`API docs: http://localhost:${env.PORT}/api/docs`);
  }
});

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
