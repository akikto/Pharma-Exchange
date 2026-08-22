import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { bannerController } from './banner.controller';
import {
  createBannerSchema,
  reorderBannersSchema,
  updateBannerSchema,
} from './banner.validation';

const publicBannerRouter = Router();
publicBannerRouter.get('/', bannerController.listActive.bind(bannerController));

const adminBannerRouter = Router();
adminBannerRouter.get('/', bannerController.listAdmin.bind(bannerController));
adminBannerRouter.post('/', validate(createBannerSchema), bannerController.create.bind(bannerController));
adminBannerRouter.patch('/reorder', validate(reorderBannersSchema), bannerController.reorder.bind(bannerController));
adminBannerRouter.get('/:id', bannerController.getById.bind(bannerController));
adminBannerRouter.patch('/:id', validate(updateBannerSchema), bannerController.update.bind(bannerController));
adminBannerRouter.delete('/:id', bannerController.delete.bind(bannerController));

export { publicBannerRouter, adminBannerRouter };
