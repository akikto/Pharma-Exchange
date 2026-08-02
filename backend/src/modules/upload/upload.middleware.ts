import multer from 'multer';
import { AppError } from '../../shared/errors/AppError';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(AppError.badRequest(`File type ${file.mimetype} not allowed`) as unknown as null, false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});
