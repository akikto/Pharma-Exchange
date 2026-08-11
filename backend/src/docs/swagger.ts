import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PharmEx API',
      version: '1.0.0',
      description: 'B2B Pharmacy Marketplace API for Bangladesh',
    },
    servers: [{ url: `http://localhost:${env.PORT}/api/v1`, description: 'Development' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Pharmacies', description: 'Pharmacy registration and verification' },
      { name: 'Medicines', description: 'Medicine catalog' },
      { name: 'Listings', description: 'Medicine listings and marketplace search' },
      { name: 'Cart', description: 'Shopping cart' },
      { name: 'Buy Requests', description: 'Buy request negotiation' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Chat', description: 'Messaging' },
      { name: 'Notifications', description: 'Push and in-app notifications' },
      { name: 'Reviews', description: 'Order reviews' },
      { name: 'Reports', description: 'Content moderation' },
      { name: 'Analytics', description: 'Seller and platform analytics' },
      { name: 'Admin', description: 'Admin panel APIs' },
      { name: 'Payments', description: 'Razorpay checkout, verify, refunds, and webhooks' },
      { name: 'Upload', description: 'File uploads' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
