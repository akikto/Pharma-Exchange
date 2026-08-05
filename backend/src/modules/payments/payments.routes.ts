import { Router, Response, NextFunction, raw } from 'express';
import { z } from 'zod';
import { AuthRequest, authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { paymentsService } from './payments.service';

// ─── Schemas ────────────────────────────────────────────────────────────────

const createOrderSchema = z.object({
  orderId: z.string().uuid('orderId must be a UUID'),
});

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

const refundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
});

// ─── Controller ─────────────────────────────────────────────────────────────

class PaymentsController {
  async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.createCheckoutOrder(req.user!.userId, req.body.orderId);
      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  async verify(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.verifyCheckout(req.user!.userId, req.body);
      res.json(result);
    } catch (err) { next(err); }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.cancelPayment(req.user!.userId, req.params.orderId as string);
      res.json(result);
    } catch (err) { next(err); }
  }

  async refund(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.refund(
        req.user!.userId, req.user!.role,
        req.params.orderId as string,
        req.body,
      );
      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  async listForOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.getForOrder(
        req.user!.userId, req.user!.role, req.params.orderId as string,
      );
      res.json({ data: result });
    } catch (err) { next(err); }
  }

  async webhook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // req.body is a Buffer thanks to express.raw() below.
      const result = await paymentsService.handleWebhook(req.body as unknown as Buffer, req.headers);
      res.json(result);
    } catch (err) { next(err); }
  }
}

const ctrl = new PaymentsController();

// ─── Webhook router (mounted BEFORE express.json in app.ts) ─────────────────
export const paymentsWebhookRouter: Router = Router();

/**
 * @openapi
 * /api/v1/payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Razorpay webhook callback (unsigned — HMAC verified)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event received
 */
paymentsWebhookRouter.post(
  '/',
  raw({ type: '*/*', limit: '256kb' }),
  ctrl.webhook.bind(ctrl),
);

// ─── JSON payments router (mounted AFTER express.json) ──────────────────────
const router = Router();

/**
 * @openapi
 * /api/v1/payments/create-order:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Razorpay order for checkout
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Checkout options for Razorpay Standard Checkout
 */
router.post('/create-order', authenticate, validate(createOrderSchema), ctrl.createOrder.bind(ctrl));

/**
 * @openapi
 * /api/v1/payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify Razorpay checkout signature after payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified and order marked paid
 */
router.post('/verify', authenticate, validate(verifySchema), ctrl.verify.bind(ctrl));

/**
 * @openapi
 * /api/v1/payments/{orderId}/cancel:
 *   post:
 *     tags: [Payments]
 *     summary: Cancel an outstanding unpaid payment attempt
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment attempt cancelled
 */
router.post('/:orderId/cancel', authenticate, ctrl.cancel.bind(ctrl));

/**
 * @openapi
 * /api/v1/payments/{orderId}/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Issue a full or partial refund via Razorpay
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Refund initiated
 */
router.post('/:orderId/refund', authenticate, validate(refundSchema), ctrl.refund.bind(ctrl));

/**
 * @openapi
 * /api/v1/payments/order/{orderId}:
 *   get:
 *     tags: [Payments]
 *     summary: List payment attempts and refunds for an order
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment history for the order
 */
router.get('/order/:orderId', authenticate, ctrl.listForOrder.bind(ctrl));

export default router;
