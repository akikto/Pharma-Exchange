import path from 'path';
import { createRequire } from 'module';

const moduleRequire = createRequire(__filename);

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

export const XLSX: XlsxModule = moduleRequire(
  path.join(__dirname, '../../vendor/xlsx/xlsx.cjs'),
);
