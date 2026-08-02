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
    await sharp(source).resize(size, size).png().toFile(out);
    console.log('Wrote', out);
  }

  const maskable = join(iconsDir, 'icon-maskable-512.png');
  await sharp(source)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 15, g: 76, b: 110, alpha: 1 },
    })
    .png()
    .toFile(maskable);
  console.log('Wrote', maskable);

  const faviconIco = join(publicDir, 'favicon.ico');
  await sharp(source).resize(32, 32).png().toFile(faviconIco.replace('.ico', '-tmp.png'));
  writeFileSync(faviconIco, readFileSync(faviconIco.replace('.ico', '-tmp.png')));
  console.log('Wrote', faviconIco, '(32px PNG as .ico fallback)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
