import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  assertAllowedImageUpload,
  optimizeMedicineImage,
  MEDICINE_IMAGE_MAX_BYTES,
} from '../src/modules/upload/image-optimization.service';

const fixturePath = join(__dirname, 'fixtures', 'tiny.png');

function loadTinyPng(): Buffer {
  return readFileSync(fixturePath);
}

describe('image optimization service', () => {
  it('accepts valid image types and rejects unsupported files', () => {
    expect(() => assertAllowedImageUpload('image/png', 'medicine.png', 1024)).not.toThrow();
    expect(() => assertAllowedImageUpload('application/pdf', 'medicine.pdf', 1024)).toThrow(/Only JPG, PNG, and WebP/i);
    expect(() => assertAllowedImageUpload('image/png', 'medicine.gif', 1024)).toThrow(/Only JPG, PNG, and WebP/i);
    expect(() => assertAllowedImageUpload('image/png', 'medicine.png', MEDICINE_IMAGE_MAX_BYTES + 1)).toThrow(/5MB/i);
  });

  it('optimizes images to compact webp output', async () => {
    const source = loadTinyPng();
    const optimized = await optimizeMedicineImage(source);
    expect(optimized.mimeType).toBe('image/webp');
    expect(optimized.extension).toBe('webp');
    expect(optimized.buffer.length).toBeGreaterThan(0);
    expect(optimized.buffer.byteLength).toBeLessThan(200 * 1024);
  });
});
