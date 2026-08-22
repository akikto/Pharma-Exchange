import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { storageService } from './storage.service';
import { AppError } from '../../shared/errors/AppError';
import {
  assertAllowedImageUpload,
  assertBannerRasterImageUpload,
  optimizeBannerImage,
  optimizeMedicineImage,
} from './image-optimization.service';
import { BANNER_MEDIA_UPLOAD_MAX_BYTES } from './upload.middleware';
import { medicineService } from '../medicine/medicine.service';
import { isFirebaseStorageConfigured, env, getFirebaseStorageDiagnostics, listMissingFirebaseStorageConfig } from '../../config/env';
import { assertValidPersistableMediaUrl, describeMediaUrlForDiagnostics } from './media-url';
import { logger } from '../../shared/utils/logger';

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
      if (env.NODE_ENV === 'production' && !isFirebaseStorageConfigured()) {
        const diagnostics = getFirebaseStorageDiagnostics();
        const missing = listMissingFirebaseStorageConfig();
        logger.warn('[banner-upload] Firebase storage not configured for production upload', diagnostics);
        throw AppError.internal(
          `Banner media storage is not configured. Missing or invalid: ${missing.join(', ') || 'unknown'}`,
        );
      }

      const { buffer, mimetype, originalname, size } = req.file;
      const folder = 'public/banners';

      let result;
      if (mimetype === 'image/gif') {
        if (size > BANNER_MEDIA_UPLOAD_MAX_BYTES) {
          throw AppError.badRequest('Banner image must be 15MB or smaller');
        }
        result = await storageService.uploadPublicBinary(buffer, mimetype, folder, 'gif', originalname);
      } else if (mimetype.startsWith('image/')) {
        assertBannerRasterImageUpload(mimetype, originalname, size);
        const optimized = await optimizeBannerImage(buffer);
        result = await storageService.uploadOptimizedImage(
          optimized.buffer,
          optimized.mimeType,
          folder,
          optimized.extension,
        );
      } else if (mimetype === 'video/mp4' || mimetype === 'video/webm') {
        if (size > BANNER_MEDIA_UPLOAD_MAX_BYTES) {
          throw AppError.badRequest('Banner video must be 15MB or smaller');
        }
        const extension = mimetype === 'video/webm' ? 'webm' : 'mp4';
        result = await storageService.uploadPublicBinary(buffer, mimetype, folder, extension, originalname);
      } else {
        throw AppError.badRequest(`Banner media type ${mimetype} not allowed`);
      }

      try {
        assertValidPersistableMediaUrl(result.url);
      } catch (validationError) {
        logger.warn('[banner-upload] Invalid media URL returned from storage', {
          ...describeMediaUrlForDiagnostics(result.url),
          storageKey: result.storageKey,
        });
        await storageService.deleteByStorageKey(result.storageKey);
        throw AppError.internal(
          validationError instanceof Error ? validationError.message : 'Invalid media URL returned from storage',
        );
      }

      res.status(201).json(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes('not publicly readable')) {
        next(AppError.internal('Uploaded banner media could not be verified as publicly accessible'));
        return;
      }
      if (err instanceof Error && err.message.includes('Firebase Storage is not configured')) {
        next(AppError.internal(err.message));
        return;
      }
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
