import path from 'path';
import { createRequire } from 'module';
import { z } from 'zod';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';
import { createMedicineSchema } from './medicine.validation';
import { XLSX } from './medicine-import.xlsx';
import {
  DOSAGE_FORM_VALUES,
  MEDICINE_IMPORT_COLUMNS,
  MEDICINE_IMPORT_MAX_ROWS,
  REQUIRED_IMPORT_COLUMNS,
  TEMPLATE_EXAMPLE_ROW,
  type MedicineImportColumn,
} from './medicine-import.constants';

export type MedicineImportMode = 'upsert' | 'createOnly' | 'updateOnly';

export interface MedicineImportRowError {
  row: number;
  name?: string;
  message: string;
}

export interface MedicineImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newMedicines: number;
  existingMedicines: number;
  duplicateInFile: number;
  errors: MedicineImportRowError[];
  mode: MedicineImportMode;
}

export interface MedicineImportResult extends MedicineImportPreviewResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

type ParsedRow = Record<string, string>;

function normalizeHeader(key: string): string {
  return key.trim().replace(/\s+/g, '');
}

function headerToField(header: string): string | null {
  const normalized = normalizeHeader(header).toLowerCase();
  const map: Record<string, MedicineImportColumn> = {
    name: 'name',
    genericname: 'genericName',
    brandname: 'brandName',
    company: 'company',
    dosageform: 'dosageForm',
    strength: 'strength',
    packsize: 'packSize',
    category: 'category',
    scheduleclass: 'scheduleClass',
    composition: 'composition',
    imageurl: 'imageUrl',
  };
  return map[normalized] ?? null;
}

export function medicineIdentityKey(parts: {
  name: string;
  company: string;
  dosageForm: string;
  strength?: string | null;
  packSize: string;
}): string {
  return [
    parts.name.trim().toLowerCase(),
    parts.company.trim().toLowerCase(),
    parts.dosageForm.trim().toUpperCase(),
    (parts.strength ?? '').trim().toLowerCase(),
    parts.packSize.trim().toLowerCase(),
  ].join('|');
}

function parseWorkbook(buffer: Buffer, filename: string): ParsedRow[] {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    raw: false,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw AppError.badRequest('The file contains no worksheets');
  }
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];
  if (matrix.length < 2) {
    throw AppError.badRequest('The file must include a header row and at least one data row');
  }

  const headerRow = matrix[0] ?? [];
  const fieldByCol: (MedicineImportColumn | null)[] = headerRow.map((cell) => {
    const field = headerToField(String(cell));
    return field as MedicineImportColumn | null;
  });

  const mappedFields = new Set(fieldByCol.filter(Boolean) as MedicineImportColumn[]);
  const missingHeaders = REQUIRED_IMPORT_COLUMNS.filter((col) => !mappedFields.has(col));
  if (missingHeaders.length > 0) {
    throw AppError.badRequest(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  const rows: ParsedRow[] = [];
  for (let r = 1; r < matrix.length; r += 1) {
    const line = matrix[r] ?? [];
    const mapped: ParsedRow = {};
    let hasValue = false;
    fieldByCol.forEach((field, colIdx) => {
      if (!field) return;
      const val = String(line[colIdx] ?? '').trim();
      if (val) hasValue = true;
      mapped[field] = val;
    });
    if (hasValue) rows.push(mapped);
  }

  if (rows.length === 0) {
    throw AppError.badRequest('The file contains no data rows');
  }

  return rows;
}

function rowToPayload(row: ParsedRow): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const col of MEDICINE_IMPORT_COLUMNS) {
    const val = row[col];
    if (val === undefined || val === '') continue;
    payload[col] = val;
  }
  if (typeof payload.dosageForm === 'string') {
    payload.dosageForm = payload.dosageForm.trim().toUpperCase();
  }
  return payload;
}

async function loadExistingKeyMap(): Promise<Map<string, string>> {
  const medicines = await prisma.medicine.findMany({
    select: { id: true, name: true, company: true, dosageForm: true, strength: true, packSize: true },
  });
  const map = new Map<string, string>();
  for (const m of medicines) {
    map.set(
      medicineIdentityKey({
        name: m.name,
        company: m.company,
        dosageForm: m.dosageForm,
        strength: m.strength,
        packSize: m.packSize,
      }),
      m.id,
    );
  }
  return map;
}

function analyzeRows(
  rows: ParsedRow[],
  existingMap: Map<string, string>,
  mode: MedicineImportMode,
): { preview: MedicineImportPreviewResult; validated: Array<{ row: number; data: z.infer<typeof createMedicineSchema>; existingId?: string }> } {
  const errors: MedicineImportRowError[] = [];
  const seenInFile = new Set<string>();
  let duplicateInFile = 0;
  let validRows = 0;
  let newMedicines = 0;
  let existingMedicines = 0;
  const validated: Array<{ row: number; data: z.infer<typeof createMedicineSchema>; existingId?: string }> = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const namePreview = row.name?.trim() || undefined;

    if (REQUIRED_IMPORT_COLUMNS.every((col) => !row[col]?.trim())) {
      return;
    }

    const payload = rowToPayload(row);
    if (!DOSAGE_FORM_VALUES.has(String(payload.dosageForm))) {
      errors.push({ row: rowNum, name: namePreview, message: 'Invalid dosageForm' });
      return;
    }

    const parsed = createMedicineSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ') || 'Validation failed';
      errors.push({ row: rowNum, name: namePreview, message });
      return;
    }

    const key = medicineIdentityKey({
      name: parsed.data.name,
      company: parsed.data.company,
      dosageForm: parsed.data.dosageForm,
      strength: parsed.data.strength,
      packSize: parsed.data.packSize,
    });

    if (seenInFile.has(key)) {
      duplicateInFile += 1;
      errors.push({ row: rowNum, name: namePreview, message: 'Duplicate medicine in file' });
      return;
    }
    seenInFile.add(key);

    const existingId = existingMap.get(key);
    if (existingId) {
      existingMedicines += 1;
      if (mode === 'createOnly') {
        errors.push({ row: rowNum, name: namePreview, message: 'Duplicate medicine' });
        return;
      }
      validated.push({ row: rowNum, data: parsed.data, existingId });
    } else {
      newMedicines += 1;
      if (mode === 'updateOnly') {
        errors.push({ row: rowNum, name: namePreview, message: 'Medicine not found for update' });
        return;
      }
      validated.push({ row: rowNum, data: parsed.data });
    }
    validRows += 1;
  });

  const preview: MedicineImportPreviewResult = {
    totalRows: rows.length,
    validRows,
    invalidRows: errors.length,
    newMedicines,
    existingMedicines,
    duplicateInFile,
    errors: errors.slice(0, 100),
    mode,
  };

  return { preview, validated };
}

export class MedicineImportService {
  parseFile(buffer: Buffer, filename: string): ParsedRow[] {
    const rows = parseWorkbook(buffer, filename);
    if (rows.length > MEDICINE_IMPORT_MAX_ROWS) {
      throw AppError.badRequest(`Maximum ${MEDICINE_IMPORT_MAX_ROWS} medicine rows per import`);
    }
    return rows;
  }

  async preview(buffer: Buffer, filename: string, mode: MedicineImportMode = 'upsert'): Promise<MedicineImportPreviewResult> {
    const rows = this.parseFile(buffer, filename);
    const existingMap = await loadExistingKeyMap();
    return analyzeRows(rows, existingMap, mode).preview;
  }

  async import(
    buffer: Buffer,
    filename: string,
    mode: MedicineImportMode,
    adminUserId: string,
  ): Promise<MedicineImportResult> {
    const rows = this.parseFile(buffer, filename);
    const existingMap = await loadExistingKeyMap();
    const { preview, validated } = analyzeRows(rows, existingMap, mode);

    let created = 0;
    let updated = 0;
    const importErrors: MedicineImportRowError[] = [...preview.errors];

    const batchSize = 50;
    for (let i = 0; i < validated.length; i += batchSize) {
      const batch = validated.slice(i, i + batchSize);
      await prisma.$transaction(async (tx) => {
        for (const item of batch) {
          try {
            if (item.existingId) {
              await tx.medicine.update({
                where: { id: item.existingId },
                data: item.data as never,
              });
              updated += 1;
            } else {
              await tx.medicine.create({ data: item.data as never });
              created += 1;
            }
          } catch (err) {
            importErrors.push({
              row: item.row,
              name: item.data.name,
              message: err instanceof Error ? err.message : 'Database error',
            });
          }
        }
      });
    }

    const failed = importErrors.length;
    const skipped = preview.totalRows - created - updated - failed;
    const result: MedicineImportResult = {
      ...preview,
      created,
      updated,
      skipped: Math.max(0, skipped),
      failed,
      errors: importErrors.slice(0, 100),
    };

    logger.info('Medicine bulk import', {
      adminUserId,
      filename,
      mode,
      created,
      updated,
      failed,
      totalRows: preview.totalRows,
    });

    return result;
  }

  async exportMedicines(query: { q?: string }): Promise<Array<Record<string, string>>> {
    const where: Record<string, unknown> = {};
    if (query.q?.trim()) {
      const term = query.q.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { genericName: { contains: term, mode: 'insensitive' } },
        { brandName: { contains: term, mode: 'insensitive' } },
        { company: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ];
    }

    const medicines = await prisma.medicine.findMany({
      where: where as never,
      orderBy: { name: 'asc' },
      take: MEDICINE_IMPORT_MAX_ROWS,
    });

    return medicines.map((m) => ({
      name: m.name,
      genericName: m.genericName ?? '',
      brandName: m.brandName ?? '',
      company: m.company,
      dosageForm: m.dosageForm,
      strength: m.strength ?? '',
      packSize: m.packSize,
      category: m.category,
      scheduleClass: m.scheduleClass ?? '',
      composition: m.composition ?? '',
      imageUrl: m.imageUrl ?? '',
      isActive: m.isActive ? 'true' : 'false',
    }));
  }

  buildTemplateWorkbook(): Buffer {
    const sheet = XLSX.utils.json_to_sheet([TEMPLATE_EXAMPLE_ROW]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Medicines');
    return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  buildExportWorkbook(rows: Array<Record<string, string>>, format: 'xlsx' | 'csv'): Buffer {
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Medicines');
    if (format === 'csv') {
      return Buffer.from(XLSX.utils.sheet_to_csv(sheet), 'utf-8');
    }
    return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}

export const medicineImportService = new MedicineImportService();
