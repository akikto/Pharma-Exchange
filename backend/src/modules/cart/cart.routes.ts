import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { cartService } from './cart.service';
import { validate } from '../../shared/middleware/validate.middleware';

const addSchema = z.object({ listingId: z.string().uuid(), quantity: z.number().int().positive() });
const updateSchema = z.object({ quantity: z.number().int().positive() });

export class CartController {
  async getCart(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await cartService.getCart(req.user!.userId)); } catch (err) { next(err); }
  }
  async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { listingId, quantity } = req.body;
      res.status(201).json(await cartService.addItem(req.user!.userId, listingId, quantity));
    } catch (err) { next(err); }
  }
  async updateQuantity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await cartService.updateQuantity(req.user!.userId, req.params.id as string, req.body.quantity));
    } catch (err) { next(err); }
  }
  async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await cartService.removeItem(req.user!.userId, req.params.id as string)); } catch (err) { next(err); }
  }
  async clearCart(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await cartService.clearCart(req.user!.userId)); } catch (err) { next(err); }
  }
}

export const cartController = new CartController();

import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();
const ctrl = new CartController();

router.get('/', authenticate, ctrl.getCart.bind(ctrl));
router.post('/', authenticate, validate(addSchema), ctrl.addItem.bind(ctrl));
router.patch('/:id', authenticate, validate(updateSchema), ctrl.updateQuantity.bind(ctrl));
router.delete('/:id', authenticate, ctrl.removeItem.bind(ctrl));
router.delete('/', authenticate, ctrl.clearCart.bind(ctrl));

export default router;
