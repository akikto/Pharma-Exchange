import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requireAdminOrVerifiedPharmacy } from '../../shared/middleware/upload-auth.middleware';
import { upload, medicineImageUpload } from './upload.middleware';
import { uploadController } from './upload.controller';

const router = Router();

router.post('/document', authenticate, upload.single('file'), uploadController.uploadDocument.bind(uploadController));
router.post('/image', authenticate, upload.single('file'), uploadController.uploadImage.bind(uploadController));
router.post(
  '/medicine-image',
  authenticate,
  requireAdminOrVerifiedPharmacy,
  medicineImageUpload.single('file'),
  uploadController.uploadMedicineImage.bind(uploadController),
);
router.post('/voice', authenticate, upload.single('file'), uploadController.uploadVoice.bind(uploadController));

export default router;
