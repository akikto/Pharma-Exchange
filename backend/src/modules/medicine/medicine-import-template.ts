import fs from 'fs';
import path from 'path';

const TEMPLATE_FILENAME = 'medicines-import-template.xlsx';

let cachedTemplate: Buffer | null = null;

function resolveTemplatePath(): string | null {
  const candidates = [
    path.join(process.cwd(), 'src/modules/medicine/assets', TEMPLATE_FILENAME),
    path.join(process.cwd(), 'backend/src/modules/medicine/assets', TEMPLATE_FILENAME),
    path.join(process.cwd(), 'dist/modules/medicine/assets', TEMPLATE_FILENAME),
    path.join(__dirname, 'assets', TEMPLATE_FILENAME),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** Prebuilt import template — avoids loading SheetJS on serverless for downloads. */
export function readMedicineImportTemplateBuffer(): Buffer {
  if (cachedTemplate) return cachedTemplate;
  const filePath = resolveTemplatePath();
  if (!filePath) {
    throw new Error(`Medicine import template asset not found (${TEMPLATE_FILENAME})`);
  }
  cachedTemplate = fs.readFileSync(filePath);
  return cachedTemplate;
}
