import { Router } from 'express';
import { authenticate, requireAdmin } from '../../shared/middleware/auth.middleware';
import { requireVerifiedPharmacy } from '../../shared/middleware/pharmacy.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { bannerController } from './banner.controller';
import {
  adminBannerListQuerySchema,
  createBannerSchema,
  createSellerAdvertisementSchema,
  listBannersQuerySchema,
  rejectBannerSchema,
  reorderBannersSchema,
  updateBannerSchema,
  updateSellerAdvertisementSchema,
} from './banner.validation';

const publicBannerRouter = Router();
publicBannerRouter.get(
  '/',
  validate(listBannersQuerySchema, 'query'),
  bannerController.listActive.bind(bannerController),
);

const sellerAdvertisementRouter = Router();
sellerAdvertisementRouter.use(authenticate, requireVerifiedPharmacy);
sellerAdvertisementRouter.get('/my', bannerController.listMyAdvertisements.bind(bannerController));
sellerAdvertisementRouter.get('/my/:id', bannerController.getMyAdvertisement.bind(bannerController));
sellerAdvertisementRouter.post(
  '/',
  validate(createSellerAdvertisementSchema),
  bannerController.createMyAdvertisement.bind(bannerController),
);
sellerAdvertisementRouter.patch(
  '/my/:id',
  validate(updateSellerAdvertisementSchema),
  bannerController.updateMyAdvertisement.bind(bannerController),
);
sellerAdvertisementRouter.delete(
  '/my/:id',
  bannerController.deleteMyAdvertisement.bind(bannerController),
);

const adminBannerRouter = Router();
adminBannerRouter.get(
  '/',
  validate(adminBannerListQuerySchema, 'query'),
  bannerController.listAdmin.bind(bannerController),
);
adminBannerRouter.get('/media-audit', bannerController.auditMediaUrls.bind(bannerController));
adminBannerRouter.post('/', validate(createBannerSchema), bannerController.create.bind(bannerController));
adminBannerRouter.patch('/reorder', validate(reorderBannersSchema), bannerController.reorder.bind(bannerController));
adminBannerRouter.get('/:id', bannerController.getById.bind(bannerController));
adminBannerRouter.patch('/:id', validate(updateBannerSchema), bannerController.update.bind(bannerController));
adminBannerRouter.delete('/:id', bannerController.delete.bind(bannerController));
adminBannerRouter.post('/:id/approve', bannerController.approve.bind(bannerController));
adminBannerRouter.post('/:id/reject', validate(rejectBannerSchema), bannerController.reject.bind(bannerController));
adminBannerRouter.post('/:id/pause', bannerController.pause.bind(bannerController));
adminBannerRouter.post('/:id/resume', bannerController.resume.bind(bannerController));

export { publicBannerRouter, adminBannerRouter, sellerAdvertisementRouter };
