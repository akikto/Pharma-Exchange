import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { medicineController } from './medicine.controller';
import { createMedicineSchema, updateMedicineSchema } from './medicine.validation';

const router = Router();

router.get('/', medicineController.search.bind(medicineController));
router.get('/:id', medicineController.getById.bind(medicineController));
router.post('/', authenticate, validate(createMedicineSchema), medicineController.create.bind(medicineController));
router.patch('/:id', authenticate, validate(updateMedicineSchema), medicineController.update.bind(medicineController));

export default router;
