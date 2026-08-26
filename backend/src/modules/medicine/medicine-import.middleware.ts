import multer from 'multer';
import { AppError } from '../../shared/errors/AppError';
import { MEDICINE_IMPORT_MAX_BYTES } from './medicine-import.constants';

const storage = multer.memoryStorage();

const allowedExtensions = new Set(['.csv', '.xlsx']);
const allowedMime = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/csv',
  'text/plain',
]);

export const medicineImportUpload = multer({
  storage,
  limits: { fileSize: MEDICINE_IMPORT_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
    if (!allowedExtensions.has(ext)) {
      cb(AppError.badRequest('Only .csv and .xlsx files are supported'));
      return;
    }
    if (file.mimetype && !allowedMime.has(file.mimetype) && file.mimetype !== 'application/octet-stream') {
      cb(AppError.badRequest(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});
