import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { storageService } from './storage.service';
import { AppError } from '../../shared/errors/AppError';
import { assertAllowedImageUpload, optimizeMedicineImage } from './image-optimization.service';
import { medicineService } from '../medicine/medicine.service';

export class UploadController {
  async uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw AppError.badRequest('No file uploaded');
      const result = await storageService.uploadFile(
        req.file.buffer, req.file.originalname, req.file.mimetype, 'documents'
      );
      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  async uploadImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw AppError.badRequest('No file uploaded');
      const result = await storageService.uploadFile(
        req.file.buffer, req.file.originalname, req.file.mimetype, 'images'
      );
      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  async uploadMedicineImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw AppError.badRequest('No file uploaded');
      assertAllowedImageUpload(req.file.mimetype, req.file.originalname, req.file.size);

      const optimized = await optimizeMedicineImage(req.file.buffer);
      const result = await storageService.uploadOptimizedImage(
        optimized.buffer,
        optimized.mimeType,
        'public/medicines',
        optimized.extension,
      );

      const replaceUrl = typeof req.body?.replaceUrl === 'string' ? req.body.replaceUrl : undefined;
      if (replaceUrl) {
        await medicineService.cleanupImageIfUnreferenced(replaceUrl);
      }

      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  async uploadBannerMedia(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw AppError.badRequest('No file uploaded');
      const result = await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'public/banners',
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async uploadVoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw AppError.badRequest('No file uploaded');
      const result = await storageService.uploadFile(
        req.file.buffer, req.file.originalname, req.file.mimetype, 'voice'
      );
      res.status(201).json(result);
    } catch (err) { next(err); }
  }
}

export const uploadController = new UploadController();
