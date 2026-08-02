import { createApp } from '../src/app';

// Vercel serverless entry — exports Express app without HTTP listen/Socket.IO/cron
const app = createApp();

export default app;
