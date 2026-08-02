/**
 * MedLink B2B – Icon & Logo Generator
 *
 * SOURCE FILES (place in frontend/public/brand/):
 *   icon.png | icon.svg | icon.jpg   → square app icon (min 512×512 recommended)
 *   logo.png | logo.svg              → horizontal logo (optional)
 *   logo-light.png                   → logo for dark backgrounds (optional)
 *
 * USAGE:
 *   npm run icons --workspace=frontend
 *
 * OUTPUT:
 *   public/icons/icon-192.png
 *   public/icons/icon-512.png
 *   public/icons/icon-maskable-512.png
 *   public/favicon.svg (from icon if SVG)
 *   public/favicon.ico (optional)
 */
import { readFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const brandDir = join(publicDir, 'brand');
const iconsDir = join(publicDir, 'icons');

const ICON_SOURCES = ['icon.png', 'icon.svg', 'icon.jpg', 'icon.jpeg', 'icon.webp'];

function findSource(dir, names) {
  for (const name of names) {
    const path = join(dir, name);
    if (existsSync(path)) return path;
  }
  return null;
}

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Install sharp: npm i -D sharp --workspace=frontend');
    process.exit(1);
  }

  mkdirSync(brandDir, { recursive: true });
  mkdirSync(iconsDir, { recursive: true });

  const source =
    findSource(brandDir, ICON_SOURCES) ??
    findSource(iconsDir, ['icon.svg', 'icon.png']);

  if (!source) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  আপনার icon যোগ করুন / Add your icon:                        ║
║                                                              ║
║  1. এই ফোল্ডারে icon রাখুন:                                  ║
║     frontend/public/brand/icon.png  (512×512 বা বড়)         ║
║                                                              ║
║  2. (ঐচ্ছিক) লোগো রাখুন:                                     ║
║     frontend/public/brand/logo.png                           ║
║     frontend/public/brand/logo-light.png  (গাঢ় ব্যাকগ্রাউন্ড) ║
║                                                              ║
║  3. আবার চালান: npm run icons --workspace=frontend           ║
╚══════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }

  console.log('Source icon:', source);

  const input = readFileSync(source);
  const isSvg = extname(source).toLowerCase() === '.svg';
  let pipeline = isSvg ? sharp(input) : sharp(input);

  for (const size of [192, 512]) {
    const out = join(iconsDir, `icon-${size}.png`);
    await pipeline.clone().resize(size, size, { fit: 'cover' }).png().toFile(out);
    console.log('✓', out);
  }

  const maskable = join(iconsDir, 'icon-maskable-512.png');
  await pipeline
    .clone()
    .resize(384, 384, { fit: 'contain', background: { r: 15, g: 118, b: 110, alpha: 1 } })
    .extend({
      top: 64,
      bottom: 64,
      left: 64,
      right: 64,
      background: { r: 15, g: 118, b: 110, alpha: 1 },
    })
    .png()
    .toFile(maskable);
  console.log('✓', maskable);

  if (isSvg) {
    const faviconSvg = join(publicDir, 'favicon.svg');
    copyFileSync(source, faviconSvg);
    console.log('✓', faviconSvg);
  } else {
    const faviconPng = join(publicDir, 'favicon.png');
    await sharp(input).resize(32, 32).png().toFile(faviconPng);
    console.log('✓', faviconPng);
  }

  const logo = findSource(brandDir, ['logo.png', 'logo.svg', 'logo.jpg']);
  if (logo) console.log('✓ Logo found:', logo, '(used in app automatically)');
  else console.log('ℹ Optional: add frontend/public/brand/logo.png for login/splash screen');

  console.log('\nDone! Icons ready for PWA and app.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
