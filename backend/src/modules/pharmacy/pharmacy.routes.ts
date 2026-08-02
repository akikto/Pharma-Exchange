import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { pharmacyController } from './pharmacy.controller';
import { registerPharmacySchema, documentSchema } from './pharmacy.validation';

const router = Router();

router.post('/register', authenticate, validate(registerPharmacySchema), pharmacyController.register.bind(pharmacyController));
router.post('/documents', authenticate, validate(documentSchema), pharmacyController.uploadDocument.bind(pharmacyController));
router.get('/me', authenticate, pharmacyController.getMyPharmacy.bind(pharmacyController));
router.get('/:id', pharmacyController.getPublicProfile.bind(pharmacyController));

export default router;
