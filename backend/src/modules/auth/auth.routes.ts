import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { authRateLimiter, otpRateLimiter, emailOtpVerifyRateLimiter } from '../../shared/middleware/rateLimit.middleware';
import {
  registerSchema, loginSchema, firebaseAuthSchema,
  otpVerifySchema, sendOtpSchema, refreshTokenSchema, fcmTokenSchema,
  resetPasswordSchema, forgotPasswordSchema, verifyEmailOtpSchema,
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
 *     summary: Email or phone + password login (primary auth — unchanged)
 */
router.post('/login', authRateLimiter, validate(loginSchema), authController.login.bind(authController));

/**
 * @openapi
 * /api/v1/auth/firebase:
 *   post:
 *     tags: [Auth]
 *     summary: Firebase auth (Google, OTP, Email)
 */
router.post('/firebase', authRateLimiter, validate(firebaseAuthSchema), authController.firebaseAuth.bind(authController));

/**
 * Password reset only (EmailOtp + Resend) — does not replace login.
 * Flow: forgot-password → verify-email-otp → reset-password → user logs in with email+password
 */
router.post('/forgot-password', otpRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/verify-email-otp', emailOtpVerifyRateLimiter, validate(verifyEmailOtpSchema), authController.verifyEmailOtp.bind(authController));
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword.bind(authController));

/** Legacy phone/login OTP (OtpToken) — separate from email password-reset OTP */
router.post('/send-otp', otpRateLimiter, validate(sendOtpSchema), authController.sendOtp.bind(authController));
router.post('/verify-otp', otpRateLimiter, validate(otpVerifySchema), authController.verifyOtp.bind(authController));
router.post('/refresh', authRateLimiter, validate(refreshTokenSchema), authController.refreshToken.bind(authController));
router.post('/logout', authenticate, authController.logout.bind(authController));
router.get('/me', authenticate, authController.getProfile.bind(authController));
router.post('/fcm-token', authenticate, validate(fcmTokenSchema), authController.registerFcmToken.bind(authController));
router.delete('/fcm-token', authenticate, validate(fcmTokenSchema), authController.removeFcmToken.bind(authController));

export default router;
