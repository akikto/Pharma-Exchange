import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { upload } from './upload.middleware';
import { uploadController } from './upload.controller';

const router = Router();

router.post('/document', authenticate, upload.single('file'), uploadController.uploadDocument.bind(uploadController));
router.post('/image', authenticate, upload.single('file'), uploadController.uploadImage.bind(uploadController));
router.post('/voice', authenticate, upload.single('file'), uploadController.uploadVoice.bind(uploadController));

export default router;
