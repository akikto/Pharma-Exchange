/**
 * Generates PWA + favicon PNGs from public/icons/logo-source.png
 * Run: npm run icons
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');
const sourcePath = join(iconsDir, 'logo-source.png');

/** Match app icon squircle; clips white square corners from the source asset. */
const ICON_CORNER_RADIUS_RATIO = 0.22;

async function resizeIconWithRoundedAlpha(sharp, source, size) {
  const radius = Math.max(1, Math.round(size * ICON_CORNER_RADIUS_RATIO));
  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
  </svg>`;
  const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
  return sharp(source)
    .resize(size, size, { fit: 'cover' })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png();
}

async function main() {
  const sharp = (await import('sharp')).default;
  mkdirSync(iconsDir, { recursive: true });
  const source = readFileSync(sourcePath);

  const sizes = [
    { size: 16, out: join(publicDir, 'favicon-16x16.png') },
    { size: 32, out: join(publicDir, 'favicon-32x32.png') },
    { size: 48, out: join(iconsDir, 'icon-48.png') },
    { size: 72, out: join(iconsDir, 'icon-72.png') },
    { size: 96, out: join(iconsDir, 'icon-96.png') },
    { size: 128, out: join(iconsDir, 'icon-128.png') },
    { size: 144, out: join(iconsDir, 'icon-144.png') },
    { size: 152, out: join(iconsDir, 'icon-152.png') },
    { size: 180, out: join(iconsDir, 'apple-touch-icon.png') },
    { size: 192, out: join(iconsDir, 'icon-192.png') },
    { size: 384, out: join(iconsDir, 'icon-384.png') },
    { size: 512, out: join(iconsDir, 'icon-512.png') },
  ];

  for (const { size, out } of sizes) {
    await (await resizeIconWithRoundedAlpha(sharp, source, size)).toFile(out);
    console.log('Wrote', out);
  }

  const maskable = join(iconsDir, 'icon-maskable-512.png');
  await (await resizeIconWithRoundedAlpha(sharp, source, 410))
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 15, g: 76, b: 110, alpha: 1 },
    })
    .toFile(maskable);
  console.log('Wrote', maskable);

  const faviconIco = join(publicDir, 'favicon.ico');
  const faviconTmp = faviconIco.replace('.ico', '-tmp.png');
  await (await resizeIconWithRoundedAlpha(sharp, source, 32)).toFile(faviconTmp);
  writeFileSync(faviconIco, readFileSync(faviconTmp));
  try { (await import('fs')).unlinkSync(faviconTmp); } catch { /* ignore */ }
  console.log('Wrote', faviconIco, '(32px PNG as .ico fallback)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
