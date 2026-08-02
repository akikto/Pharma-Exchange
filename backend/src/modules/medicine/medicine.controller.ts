import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { medicineService } from './medicine.service';
import { paginationMeta } from '../../shared/utils/helpers';

export class MedicineController {
  async search(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, total, page, limit } = await medicineService.search(req.query);
      res.json({ data, pagination: paginationMeta(page, limit, total) });
    } catch (err) { next(err); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const medicine = await medicineService.getById(req.params.id as string);
      res.json(medicine);
    } catch (err) { next(err); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const medicine = await medicineService.create(req.body);
      res.status(201).json(medicine);
    } catch (err) { next(err); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const medicine = await medicineService.update(req.params.id as string, req.body);
      res.json(medicine);
    } catch (err) { next(err); }
  }
}

export const medicineController = new MedicineController();
