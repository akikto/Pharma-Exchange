import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { listingService } from './listing.service';
import { paginationMeta } from '../../shared/utils/helpers';

export class ListingController {
  async search(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, total, page, limit } = await listingService.search(req.query);
      res.json({ data, pagination: paginationMeta(page, limit, total) });
    } catch (err) { next(err); }
  }

  async compare(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await listingService.compareByMedicine(req.query);
      res.json(result);
    } catch (err) { next(err); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const listing = await listingService.getById(req.params.id as string);
      res.json(listing);
    } catch (err) { next(err); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const listing = await listingService.create(req.user!.userId, req.body);
      res.status(201).json(listing);
    } catch (err) { next(err); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const listing = await listingService.update(req.user!.userId, req.params.id as string, req.body);
      res.json(listing);
    } catch (err) { next(err); }
  }

  async updatePrice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { sellingPrice, discountPercent } = req.body;
      const listing = await listingService.updatePrice(req.user!.userId, req.params.id as string, sellingPrice, discountPercent);
      res.json(listing);
    } catch (err) { next(err); }
  }

  async updateQuantity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const listing = await listingService.updateQuantity(req.user!.userId, req.params.id as string, req.body.availableQty);
      res.json(listing);
    } catch (err) { next(err); }
  }

  async pause(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const listing = await listingService.pause(req.user!.userId, req.params.id as string);
      res.json(listing);
    } catch (err) { next(err); }
  }

  async activate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const listing = await listingService.activate(req.user!.userId, req.params.id as string);
      res.json(listing);
    } catch (err) { next(err); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const listing = await listingService.delete(req.user!.userId, req.params.id as string);
      res.json({ message: 'Listing paused', listing });
    } catch (err) { next(err); }
  }

  async getSellerListings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, total, page, limit } = await listingService.getSellerListings(req.user!.userId, req.query);
      res.json({ data, pagination: paginationMeta(page, limit, total) });
    } catch (err) { next(err); }
  }

  async getInventoryStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await listingService.getInventoryStats(req.user!.userId);
      res.json(stats);
    } catch (err) { next(err); }
  }

  async exportInventory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const csv = await listingService.exportInventoryCsv(req.user!.userId);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory.csv"');
      res.send(csv);
    } catch (err) { next(err); }
  }

  async restock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const amount = req.body.amount ?? 50;
      const listing = await listingService.restock(req.user!.userId, req.params.id as string, amount);
      res.json(listing);
    } catch (err) { next(err); }
  }

  async markSoldOut(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const listing = await listingService.markSoldOut(req.user!.userId, req.params.id as string);
      res.json(listing);
    } catch (err) { next(err); }
  }
}

export const listingController = new ListingController();
