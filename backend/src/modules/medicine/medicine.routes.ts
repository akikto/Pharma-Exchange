import { Router } from 'express';
import { authenticate, requireAdmin } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { medicineController } from './medicine.controller';
import { createMedicineSchema, updateMedicineSchema } from './medicine.validation';

const router = Router();

router.get('/', medicineController.search.bind(medicineController));
router.get('/:id/alternatives', medicineController.getAlternatives.bind(medicineController));
router.get('/:id', medicineController.getById.bind(medicineController));
router.post('/', authenticate, requireAdmin, validate(createMedicineSchema), medicineController.create.bind(medicineController));
router.patch('/:id', authenticate, requireAdmin, validate(updateMedicineSchema), medicineController.update.bind(medicineController));

export default router;
