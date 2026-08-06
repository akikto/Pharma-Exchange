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

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  newPassword: z.string().min(8),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const fcmTokenSchema = z.object({
  token: z.string().min(1),
  deviceId: z.string().optional(),
  platform: z.enum(['ios', 'android', 'web']).optional(),
});

export const notificationPrefsSchema = z.object({
  buyRequests: z.boolean().optional(),
  orders: z.boolean().optional(),
  chat: z.boolean().optional(),
  promotions: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  language: z.enum(['en', 'bn']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notificationPrefs: notificationPrefsSchema.optional(),
});
