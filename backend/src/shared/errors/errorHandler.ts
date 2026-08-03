import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from './AppError';
import { mapPrismaError, mapPrismaInitError } from './prismaErrors';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    if (mapped) {
      logger.error('Prisma request error', { code: err.code, message: err.message });
      res.status(mapped.statusCode).json({ error: mapped.message, code: mapped.code });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    const mapped = mapPrismaInitError(err);
    logger.error('Prisma initialization error', { message: err.message });
    res.status(mapped.statusCode).json({ error: mapped.message, code: mapped.code });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
}
