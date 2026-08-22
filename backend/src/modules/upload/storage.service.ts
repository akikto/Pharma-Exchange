import { v4 as uuidv4 } from 'uuid';
import { getFirebaseStorage } from '../../config/firebase';
import { env, isFirebaseStorageConfigured, getFirebaseStorageBucket } from '../../config/env';
import { logger } from '../../shared/utils/logger';
import {
  assertMediaUrlReadable,
  buildFirebaseDownloadUrl,
  isDevPlaceholderMediaUrl,
} from './media-url';

export type UploadResult = {
  url: string;
  storageKey: string;
  fileName: string;
};

export class StorageService {
  buildPublicUrl(storageKey: string, downloadToken?: string): string {
    const bucket = getFirebaseStorageBucket();
    if (!bucket) {
      return `https://storage.example.com/${storageKey}`;
    }
    if (downloadToken) {
      return buildFirebaseDownloadUrl(storageKey, downloadToken);
    }
    const encoded = encodeURIComponent(storageKey);
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media`;
  }

  extractStorageKey(urlOrKey: string): string | null {
    if (!urlOrKey) return null;
    if (urlOrKey.startsWith('public/')) return urlOrKey;

    try {
      const parsed = new URL(urlOrKey);
      if (parsed.hostname === 'firebasestorage.googleapis.com') {
        const objectMatch = parsed.pathname.match(/\/o\/(.+)$/);
        if (objectMatch?.[1]) {
          return decodeURIComponent(objectMatch[1].split('?')[0] ?? objectMatch[1]);
        }
      }
    } catch {
      // fall through
    }

    const bucket = getFirebaseStorageBucket();
    const bucketPrefix = bucket
      ? `https://storage.googleapis.com/${bucket}/`
      : 'https://storage.example.com/';
    if (urlOrKey.startsWith(bucketPrefix)) {
      return urlOrKey.slice(bucketPrefix.length);
    }

    if (bucket) {
      const signedMarker = `${bucket}/`;
      const signedIndex = urlOrKey.indexOf(signedMarker);
      if (signedIndex >= 0) {
        const path = urlOrKey.slice(signedIndex + signedMarker.length).split('?')[0];
        return decodeURIComponent(path);
      }
    }

    return null;
  }

  private async savePublicObject(
    buffer: Buffer,
    mimeType: string,
    storageKey: string,
    displayFileName: string,
  ): Promise<UploadResult> {
    if (!storageKey.startsWith('public/')) {
      throw new Error('savePublicObject requires a public/ storage key');
    }

    if (env.NODE_ENV === 'production' && !isFirebaseStorageConfigured()) {
      throw new Error('Firebase Storage is not configured for public media uploads');
    }

    const storage = getFirebaseStorage();
    if (!storage) {
      const url = this.buildPublicUrl(storageKey);
      logger.warn(`[DEV] Public media upload simulated: ${url}`);
      return { url, storageKey, fileName: displayFileName };
    }

    const downloadToken = uuidv4();
    const file = storage.bucket().file(storageKey);
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const url = buildFirebaseDownloadUrl(storageKey, downloadToken);
    try {
      await assertMediaUrlReadable(url);
    } catch (error) {
      try {
        await file.delete({ ignoreNotFound: true });
      } catch {
        logger.warn(`Failed to delete unreadable storage object: ${storageKey}`);
      }
      throw error;
    }

    return { url, storageKey, fileName: displayFileName };
  }

  async uploadOptimizedImage(
    buffer: Buffer,
    mimeType: string,
    folder: string,
    extension: string,
  ): Promise<UploadResult> {
    const storageKey = `${folder}/${uuidv4()}.${extension}`;
    return this.savePublicObject(buffer, mimeType, storageKey, storageKey.split('/').pop() ?? storageKey);
  }

  async uploadPublicBinary(
    buffer: Buffer,
    mimeType: string,
    folder: string,
    extension: string,
    displayFileName: string,
  ): Promise<UploadResult> {
    const safeExt = extension.replace(/^\./, '');
    const storageKey = `${folder}/${uuidv4()}.${safeExt}`;
    return this.savePublicObject(buffer, mimeType, storageKey, displayFileName);
  }

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
      public: false,
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    return { url, fileName: originalName };
  }

  async deleteByStorageKey(storageKey: string): Promise<void> {
    const storage = getFirebaseStorage();
    if (!storage || !storageKey) return;

    try {
      await storage.bucket().file(storageKey).delete({ ignoreNotFound: true });
    } catch {
      logger.warn(`Failed to delete storage object: ${storageKey}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const storageKey = this.extractStorageKey(fileUrl);
    if (storageKey) {
      await this.deleteByStorageKey(storageKey);
    }
  }

  isDevPlaceholderUrl(url: string): boolean {
    return isDevPlaceholderMediaUrl(url);
  }
}

export const storageService = new StorageService();
