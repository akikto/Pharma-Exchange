import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { pharmacyService } from './pharmacy.service';
import { parsePagination, paginationMeta } from '../../shared/utils/helpers';

export class PharmacyController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pharmacy = await pharmacyService.register(req.user!.userId, req.body);
      res.status(201).json(pharmacy);
    } catch (err) { next(err); }
  }

  async uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doc = await pharmacyService.uploadDocument(req.user!.userId, req.body);
      res.status(201).json(doc);
    } catch (err) { next(err); }
  }

  async getMyPharmacy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pharmacy = await pharmacyService.getMyPharmacy(req.user!.userId);
      res.json(pharmacy);
    } catch (err) { next(err); }
  }

  async getPublicProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pharmacy = await pharmacyService.getPublicProfile(req.params.id as string);
      res.json(pharmacy);
    } catch (err) { next(err); }
  }

  async listDemoShops(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await pharmacyService.listDemoShops());
    } catch (err) { next(err); }
  }
}

export const pharmacyController = new PharmacyController();
