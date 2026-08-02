import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { storageService } from './storage.service';
import { AppError } from '../../shared/errors/AppError';

export class UploadController {
  async uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw AppError.badRequest('No file uploaded');
      const folder = (req.query.folder as string) || 'documents';
      const result = await storageService.uploadFile(
        req.file.buffer, req.file.originalname, req.file.mimetype, folder
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
