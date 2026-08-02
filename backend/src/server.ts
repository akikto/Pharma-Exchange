import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { initializeSocket } from './socket';
import { startBackgroundJobs } from './jobs';

const app = createApp();
const httpServer = createServer(app);

initializeSocket(httpServer);
startBackgroundJobs();

httpServer.listen(env.PORT, () => {
  logger.info(`PharmEx API v1.0.0 running on http://localhost:${env.PORT}`);
  logger.info(`API docs: http://localhost:${env.PORT}/api/docs`);
  logger.info(`WebSocket: ws://localhost:${env.PORT}/socket.io`);
});

export default app;
