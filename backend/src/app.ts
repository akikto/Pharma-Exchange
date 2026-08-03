import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { getCorsOriginConfig } from './config/cors';
import { initializeFirebase } from './config/firebase';
import { errorHandler, notFoundHandler } from './shared/errors/errorHandler';
import { globalRateLimiter } from './shared/middleware/rateLimit.middleware';
import { swaggerSpec } from './docs/swagger';

import authRoutes from './modules/auth/auth.routes';
import pharmacyRoutes from './modules/pharmacy/pharmacy.routes';
import medicineRoutes from './modules/medicine/medicine.routes';
import listingRoutes from './modules/listing/listing.routes';
import cartRoutes from './modules/cart/cart.routes';
import buyRequestRoutes from './modules/buy-request/buyRequest.routes';
import bulkRequestRoutes from './modules/bulk-request/bulkRequest.routes';
import watchlistRoutes from './modules/watchlist/watchlist.routes';
import priceAlertRoutes from './modules/watchlist/priceAlert.routes';
import orderRoutes from './modules/order/order.routes';
import chatRoutes from './modules/chat/chat.routes';
import notificationRoutes from './modules/notification/notification.routes';
import reviewRoutes from './modules/review/review.routes';
import reportRoutes from './modules/report/report.routes';
import uploadRoutes from './modules/upload/upload.routes';
import { analyticsRouter, adminRouter } from './modules/admin/admin.routes';
import healthRoutes from './modules/health/health.routes';
import aiMatchRoutes from './modules/ai-match/aiMatch.routes';

export function createApp(): express.Application {
  initializeFirebase();

  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
  }));
  app.use(cors({
    origin: getCorsOriginConfig(),
    // JWT bearer auth — no cookies; omit credentials to avoid mobile CORS issues
    credentials: false,
  }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '2mb' }));
  app.use(globalRateLimiter);

  app.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'pharma-exchange-api',
      version: '1.0.0',
      health: '/health',
      api: '/api/v1',
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'pharma-exchange-api', version: '1.0.0' });
  });

  if (env.NODE_ENV !== 'production') {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
  }

  const v1 = express.Router();
  v1.use('/health', healthRoutes);
  v1.use('/auth', authRoutes);
  v1.use('/pharmacies', pharmacyRoutes);
  v1.use('/medicines', medicineRoutes);
  v1.use('/listings', listingRoutes);
  v1.use('/cart', cartRoutes);
  v1.use('/buy-requests', buyRequestRoutes);
  v1.use('/bulk-requests', bulkRequestRoutes);
  v1.use('/watchlist', watchlistRoutes);
  v1.use('/price-alerts', priceAlertRoutes);
  v1.use('/orders', orderRoutes);
  v1.use('/chat', chatRoutes);
  v1.use('/notifications', notificationRoutes);
  v1.use('/reviews', reviewRoutes);
  v1.use('/reports', reportRoutes);
  v1.use('/upload', uploadRoutes);
  v1.use('/analytics', analyticsRouter);
  v1.use('/admin', adminRouter);
  v1.use('/ai-matches', aiMatchRoutes);

  app.use('/api/v1', v1);

  // Legacy route aliases
  app.use('/api/auth', authRoutes);
  // Bare /auth/* for clients configured with server root as API base
  app.use('/auth', authRoutes);
  app.use('/api/pharmacies', pharmacyRoutes);
  app.use('/api/medicines', medicineRoutes);
  app.use('/api/listings', listingRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/buy-requests', buyRequestRoutes);
  app.use('/api/bulk-requests', bulkRequestRoutes);
  app.use('/api/watchlist', watchlistRoutes);
  app.use('/api/price-alerts', priceAlertRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/ai-matches', aiMatchRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
