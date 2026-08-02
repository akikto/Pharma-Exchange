import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { listingController } from './listing.controller';
import {
  createListingSchema, updateListingSchema,
  updatePriceSchema, updateQuantitySchema, marketplaceSearchSchema,
} from './listing.validation';

const router = Router();

// Marketplace search (public)
router.get('/search', validate(marketplaceSearchSchema, 'query'), listingController.search.bind(listingController));

// Seller inventory
router.get('/inventory', authenticate, listingController.getSellerListings.bind(listingController));

router.get('/:id', listingController.getById.bind(listingController));
router.post('/', authenticate, validate(createListingSchema), listingController.create.bind(listingController));
router.patch('/:id', authenticate, validate(updateListingSchema), listingController.update.bind(listingController));
router.patch('/:id/price', authenticate, validate(updatePriceSchema), listingController.updatePrice.bind(listingController));
router.patch('/:id/quantity', authenticate, validate(updateQuantitySchema), listingController.updateQuantity.bind(listingController));
router.post('/:id/pause', authenticate, listingController.pause.bind(listingController));
router.post('/:id/activate', authenticate, listingController.activate.bind(listingController));
router.delete('/:id', authenticate, listingController.delete.bind(listingController));

export default router;
