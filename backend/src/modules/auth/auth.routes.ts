import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { authRateLimiter } from '../../shared/middleware/rateLimit.middleware';
import {
  registerSchema, loginSchema, firebaseAuthSchema,
  forgotPasswordSchema, resetPasswordSchema,
  refreshTokenSchema, fcmTokenSchema,
  updateProfileSchema,
} from './auth.validation';

const router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register with email/phone and password
 */
router.post('/register', authRateLimiter, validate(registerSchema), authController.register.bind(authController));

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Email or phone login
 */
router.post('/login', authRateLimiter, validate(loginSchema), authController.login.bind(authController));
router.post('/demo-login', authRateLimiter, authController.demoLogin.bind(authController));

/**
 * @openapi
 * /api/v1/auth/firebase:
 *   post:
 *     tags: [Auth]
 *     summary: Firebase auth (Google)
 */
router.post('/firebase', authRateLimiter, validate(firebaseAuthSchema), authController.firebaseAuth.bind(authController));

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset email
 */
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword.bind(authController));

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with email token (no JWT issued)
 */
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword.bind(authController));

router.post('/refresh', authRateLimiter, validate(refreshTokenSchema), authController.refreshToken.bind(authController));
router.post('/logout', authenticate, authController.logout.bind(authController));
router.get('/me', authenticate, authController.getProfile.bind(authController));
router.patch('/me', authenticate, validate(updateProfileSchema), authController.updateProfile.bind(authController));
router.post('/fcm-token', authenticate, validate(fcmTokenSchema), authController.registerFcmToken.bind(authController));
router.delete('/fcm-token', authenticate, validate(fcmTokenSchema), authController.removeFcmToken.bind(authController));

export default router;
