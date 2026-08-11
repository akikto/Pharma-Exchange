import sharp from 'sharp';
import { AppError } from '../../shared/errors/AppError';

export const MEDICINE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MEDICINE_IMAGE_MAX_DIMENSION = 800;
export const MEDICINE_IMAGE_WEBP_QUALITY = 80;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export function assertAllowedImageUpload(mimeType: string, originalName: string, size: number): void {
  const extension = originalName.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
  if (!ALLOWED_MIME_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(extension)) {
    throw AppError.badRequest('Only JPG, PNG, and WebP images are allowed');
  }
  if (size > MEDICINE_IMAGE_MAX_BYTES) {
    throw AppError.badRequest('Image must be 5MB or smaller');
  }
}

export async function optimizeMedicineImage(
  buffer: Buffer,
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  const optimized = await sharp(buffer)
    .rotate()
    .resize({
      width: MEDICINE_IMAGE_MAX_DIMENSION,
      height: MEDICINE_IMAGE_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: MEDICINE_IMAGE_WEBP_QUALITY })
    .toBuffer();

  return {
    buffer: optimized,
    mimeType: 'image/webp',
    extension: 'webp',
  };
}
