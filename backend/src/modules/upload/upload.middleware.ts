import multer from 'multer';
import { AppError } from '../../shared/errors/AppError';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MEDICINE_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

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

const medicineImageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  if (allowed.includes(file.mimetype) && allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(AppError.badRequest('Only JPG, PNG, and WebP images are allowed') as unknown as null, false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export const medicineImageUpload = multer({
  storage,
  limits: { fileSize: MEDICINE_IMAGE_UPLOAD_MAX_BYTES },
  fileFilter: medicineImageFilter,
});
