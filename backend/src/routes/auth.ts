import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { generateOtp, signAccessToken, signRefreshToken } from '../lib/auth';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
}).refine((d) => d.email || d.phone, { message: 'Email or phone is required' });

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
}).refine((d) => d.email || d.phone, { message: 'Email or phone is required' });

const otpVerifySchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  code: z.string().length(6),
  purpose: z.enum(['registration', 'login', 'password_reset']),
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
    }
    if (data.phone) {
      const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing) {
        res.status(409).json({ error: 'Phone already registered' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: { id: true, email: true, phone: true, firstName: true, lastName: true },
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.otpToken.create({
      data: {
        userId: user.id,
        phone: data.phone,
        email: data.email,
        code: otp,
        purpose: 'registration',
        expiresAt,
      },
    });

    if (process.env.OTP_DEV_MODE === 'true') {
      console.log(`[DEV OTP] Registration OTP for ${data.phone || data.email}: ${otp}`);
    }

    res.status(201).json({
      message: 'Registration successful. Please verify OTP.',
      userId: user.id,
      ...(process.env.OTP_DEV_MODE === 'true' && { devOtp: otp }),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: data.email ? { email: data.email } : { phone: data.phone },
    });

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    const data = otpVerifySchema.parse(req.body);

    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        code: data.code,
        purpose: data.purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
        ...(data.phone ? { phone: data.phone } : { email: data.email }),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    await prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    if (otpRecord.userId) {
      const user = await prisma.user.findUnique({ where: { id: otpRecord.userId } });
      if (user) {
        const payload = { userId: user.id, role: user.role };
        res.json({
          message: 'OTP verified',
          accessToken: signAccessToken(payload),
          refreshToken: signRefreshToken(payload),
        });
        return;
      }
    }

    res.json({ message: 'OTP verified' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        language: true,
        theme: true,
        pharmacy: {
          select: {
            id: true,
            name: true,
            verificationStatus: true,
            rating: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
