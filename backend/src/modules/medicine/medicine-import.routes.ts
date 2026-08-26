import { Router } from 'express';
import { medicineImportUpload } from './medicine-import.middleware';
import { medicineImportController } from './medicine-import.controller';

const medicineImportRouter = Router();

medicineImportRouter.get(
  '/import/template',
  medicineImportController.downloadTemplate.bind(medicineImportController),
);
medicineImportRouter.get(
  '/export',
  medicineImportController.exportMedicines.bind(medicineImportController),
);
medicineImportRouter.post(
  '/import/preview',
  medicineImportUpload.single('file'),
  medicineImportController.preview.bind(medicineImportController),
);
medicineImportRouter.post(
  '/import',
  medicineImportUpload.single('file'),
  medicineImportController.import.bind(medicineImportController),
);

export { medicineImportRouter };
