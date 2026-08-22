import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { bannerService } from './banner.service';

export class BannerController {
  async listActive(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await bannerService.listActive();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async listAdmin(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await bannerService.listAdmin();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.getById(req.params.id as string);
      res.json(banner);
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.create(req.body);
      res.status(201).json(banner);
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.update(req.params.id as string, req.body);
      res.json(banner);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await bannerService.delete(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async reorder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await bannerService.reorder(req.body.orderedIds);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
}

export const bannerController = new BannerController();
