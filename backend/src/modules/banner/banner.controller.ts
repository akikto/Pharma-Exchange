import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { bannerService } from './banner.service';
import { BannerUserLocation } from './banner-targeting';

function parseLocationQuery(req: AuthRequest): BannerUserLocation {
  const { latitude, longitude, country, state, city } = req.query;
  return {
    latitude: latitude != null ? Number(latitude) : null,
    longitude: longitude != null ? Number(longitude) : null,
    country: typeof country === 'string' ? country : null,
    state: typeof state === 'string' ? state : null,
    city: typeof city === 'string' ? city : null,
  };
}

export class BannerController {
  async listActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await bannerService.listActive(parseLocationQuery(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async listAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, bannerType } = req.query;
      const data = await bannerService.listAdmin({
        status: status as never,
        bannerType: bannerType as never,
      });
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

  async auditMediaUrls(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await bannerService.auditMediaUrls();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.approve(req.params.id as string, req.user!.userId);
      res.json(banner);
    } catch (err) {
      next(err);
    }
  }

  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.reject(
        req.params.id as string,
        req.user!.userId,
        req.body.rejectionReason,
      );
      res.json(banner);
    } catch (err) {
      next(err);
    }
  }

  async pause(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.pause(req.params.id as string);
      res.json(banner);
    } catch (err) {
      next(err);
    }
  }

  async resume(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.resume(req.params.id as string);
      res.json(banner);
    } catch (err) {
      next(err);
    }
  }

  async listMyAdvertisements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await bannerService.listSellerAdvertisements(req.user!.userId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getMyAdvertisement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.getSellerAdvertisementById(req.user!.userId, req.params.id as string);
      res.json(banner);
    } catch (err) {
      next(err);
    }
  }

  async createMyAdvertisement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.createSellerAdvertisement(req.user!.userId, req.body);
      res.status(201).json(banner);
    } catch (err) {
      next(err);
    }
  }

  async updateMyAdvertisement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.updateSellerAdvertisement(
        req.user!.userId,
        req.params.id as string,
        req.body,
      );
      res.json(banner);
    } catch (err) {
      next(err);
    }
  }

  async deleteMyAdvertisement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await bannerService.cancelSellerAdvertisement(req.user!.userId, req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const bannerController = new BannerController();
