import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
}).refine((d) => d.email || d.phone, { message: 'Email or phone is required' });

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
}).refine((d) => d.email || d.phone, { message: 'Email or phone is required' });

export const firebaseAuthSchema = z.object({
  idToken: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const otpVerifySchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  code: z.string().length(6),
  purpose: z.enum(['registration', 'login', 'password_reset']),
});

export const sendOtpSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  purpose: z.enum(['login', 'password_reset']).default('login'),
}).refine((d) => d.phone || d.email, { message: 'Phone or email is required' });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const fcmTokenSchema = z.object({
  token: z.string().min(1),
  deviceId: z.string().optional(),
  platform: z.enum(['ios', 'android', 'web']).optional(),
});
