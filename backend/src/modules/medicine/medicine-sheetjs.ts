import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

export type XlsxWorkbook = {
  SheetNames: string[];
  Sheets: Record<string, unknown>;
};

type XlsxUtils = {
  sheet_to_json: (sheet: unknown, opts?: Record<string, unknown>) => unknown;
  json_to_sheet: (data: Record<string, unknown>[]) => unknown;
  book_new: () => unknown;
  book_append_sheet: (book: unknown, sheet: unknown, name: string) => void;
  sheet_to_csv: (sheet: unknown) => string;
};

export type XlsxModule = {
  read: (data: Buffer, opts?: Record<string, unknown>) => XlsxWorkbook;
  utils: XlsxUtils;
  write: (book: unknown, opts: { type: string; bookType: string }) => Buffer;
};

let cached: XlsxModule | null = null;

function resolveXlsxModulePath(): string {
  const candidates = [
    path.join(__dirname, '../../vendor/xlsx/xlsx.cjs'),
    path.join(process.cwd(), 'src/vendor/xlsx/xlsx.cjs'),
    path.join(process.cwd(), 'backend/src/vendor/xlsx/xlsx.cjs'),
    path.join(process.cwd(), 'dist/vendor/xlsx/xlsx.cjs'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('SheetJS vendor module not found (xlsx.cjs)');
}

export function getXlsx(): XlsxModule {
  if (!cached) {
    const moduleRequire = createRequire(__filename);
    cached = moduleRequire(resolveXlsxModulePath()) as XlsxModule;
  }
  return cached;
}
