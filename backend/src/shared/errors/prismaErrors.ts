import { Prisma } from '@prisma/client';
import { AppError } from './AppError';

export function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): AppError | null {
  switch (err.code) {
    case 'P2002': {
      const target = Array.isArray(err.meta?.target)
        ? err.meta.target.join(', ')
        : String(err.meta?.target ?? 'field');
      return AppError.conflict(`A record with this ${target} already exists`);
    }
    case 'P2021':
      return AppError.serviceUnavailable('Database schema is out of date. Run migrations and redeploy.');
    case 'P2022':
      return AppError.serviceUnavailable('Database schema is out of date. Run migrations and redeploy.');
    default:
      return null;
  }
}

export function mapPrismaInitError(err: Prisma.PrismaClientInitializationError): AppError {
  return AppError.serviceUnavailable('Database connection failed');
}
