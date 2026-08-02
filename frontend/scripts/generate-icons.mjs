/**
 * Generates minimal PWA PNG icons from SVG (requires sharp).
 * Run: node scripts/generate-icons.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public', 'icons');

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('sharp not installed; skipping PNG generation. Install with: npm i -D sharp');
    process.exit(0);
  }

  mkdirSync(publicDir, { recursive: true });
  const svg = readFileSync(join(publicDir, 'icon.svg'));

  for (const size of [192, 512]) {
    const out = join(publicDir, `icon-${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log('Wrote', out);
  }

  const maskable = join(publicDir, 'icon-maskable-512.png');
  await sharp(svg).resize(512, 512).extend({
    top: 64,
    bottom: 64,
    left: 64,
    right: 64,
    background: { r: 13, g: 148, b: 136, alpha: 1 },
  }).png().toFile(maskable);
  console.log('Wrote', maskable);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
