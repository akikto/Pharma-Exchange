import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { AppError } from '../../shared/errors/AppError';
import {
  medicineImportService,
  type MedicineImportMode,
} from './medicine-import.service';

const importModeSchema = z.object({
  mode: z.enum(['upsert', 'createOnly', 'updateOnly']).optional().default('upsert'),
});

function formatExportDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function contentTypeFor(format: 'csv' | 'xlsx'): string {
  return format === 'csv'
    ? 'text/csv; charset=utf-8'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}

export class MedicineImportController {
  async downloadTemplate(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const buffer = medicineImportService.buildTemplateWorkbook();
      res.setHeader('Content-Type', contentTypeFor('xlsx'));
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="pharma-exchange-medicines-template.xlsx"',
      );
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  async exportMedicines(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const format = String(req.query.format ?? 'xlsx').toLowerCase();
      if (format !== 'csv' && format !== 'xlsx') {
        throw AppError.badRequest('format must be csv or xlsx');
      }
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const rows = await medicineImportService.exportMedicines({ q });
      const buffer = medicineImportService.buildExportWorkbook(rows, format);
      const filename = `pharma-exchange-medicines-${formatExportDate()}.${format}`;
      res.setHeader('Content-Type', contentTypeFor(format));
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  async preview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file?.buffer?.length) {
        throw AppError.badRequest('A .csv or .xlsx file is required');
      }
      const { mode } = importModeSchema.parse(req.body);
      const result = await medicineImportService.preview(
        file.buffer,
        file.originalname,
        mode as MedicineImportMode,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async import(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file?.buffer?.length) {
        throw AppError.badRequest('A .csv or .xlsx file is required');
      }
      const { mode } = importModeSchema.parse(req.body);
      const result = await medicineImportService.import(
        file.buffer,
        file.originalname,
        mode as MedicineImportMode,
        req.user!.userId,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const medicineImportController = new MedicineImportController();
