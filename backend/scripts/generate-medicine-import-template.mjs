#!/usr/bin/env node
/**
 * Regenerates src/modules/medicine/assets/medicines-import-template.xlsx
 * from TEMPLATE_EXAMPLE_ROW (requires vendored SheetJS).
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');
const xlsxPath = path.join(backendRoot, 'src/vendor/xlsx/xlsx.cjs');
const outPath = path.join(backendRoot, 'src/modules/medicine/assets/medicines-import-template.xlsx');

const row = {
  name: 'Napa Extra',
  genericName: 'Paracetamol',
  brandName: 'Napa Extra',
  company: 'Beximco Pharmaceuticals',
  dosageForm: 'TABLET',
  strength: '500mg',
  packSize: '10 tablets',
  category: 'Analgesic',
  scheduleClass: '',
  composition: 'Paracetamol 500mg',
  imageUrl: '',
};

const require = createRequire(import.meta.url);
const XLSX = require(xlsxPath);
const sheet = XLSX.utils.json_to_sheet([row]);
const book = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(book, sheet, 'Medicines');
const buf = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, buf);
console.log(`Wrote ${outPath} (${buf.length} bytes)`);
