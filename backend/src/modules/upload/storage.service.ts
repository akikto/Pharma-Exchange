import { v4 as uuidv4 } from 'uuid';
import { getFirebaseStorage } from '../../config/firebase';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';

export class StorageService {
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string
  ): Promise<{ url: string; fileName: string }> {
    const storage = getFirebaseStorage();
    const fileName = `${folder}/${uuidv4()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    if (!storage) {
      const devUrl = `https://storage.example.com/${fileName}`;
      logger.warn(`[DEV] File upload simulated: ${devUrl}`);
      return { url: devUrl, fileName: originalName };
    }

    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: { contentType: mimeType },
      public: true,
    });

    const url = `https://storage.googleapis.com/${env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
    return { url, fileName: originalName };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const storage = getFirebaseStorage();
    if (!storage) return;

    try {
      const bucket = storage.bucket();
      const path = fileUrl.split(`${env.FIREBASE_STORAGE_BUCKET}/`)[1];
      if (path) await bucket.file(path).delete();
    } catch {
      logger.warn(`Failed to delete file: ${fileUrl}`);
    }
  }
}

export const storageService = new StorageService();
