import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import prisma from '../src/config/database';

describe('PATCH /api/v1/auth/me', () => {
  const app = createApp();

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('password123', 12);
    const buyerDefaults = {
      email: 'buyer@pharmex.bd',
      phone: '+919876543210',
      firstName: 'Rahim',
      lastName: 'Hossain',
      passwordHash,
      isActive: true,
    };

    const buyerByEmail = await prisma.user.findUnique({ where: { email: buyerDefaults.email } });
    const buyerByPhone = await prisma.user.findFirst({ where: { phone: buyerDefaults.phone } });

    if (!buyerByEmail && buyerByPhone) {
      await prisma.user.update({
        where: { id: buyerByPhone.id },
        data: buyerDefaults,
      });
    } else {
      await prisma.user.upsert({
        where: { email: buyerDefaults.email },
        update: buyerDefaults,
        create: { ...buyerDefaults, role: 'USER' },
      });
    }

    await prisma.user.upsert({
      where: { email: 'seller@pharmex.bd' },
      update: {
        phone: '+919153014194',
        passwordHash,
        isActive: true,
      },
      create: {
        email: 'seller@pharmex.bd',
        phone: '+919153014194',
        passwordHash,
        firstName: 'Karim',
        lastName: 'Ahmed',
        role: 'USER',
      },
    });
  });

  async function loginBuyer() {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer@pharmex.bd', password: 'password123' });
    expect(res.status).toBe(200);
    return res.body.accessToken as string;
  }

  async function loginSeller() {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'seller@pharmex.bd', password: 'password123' });
    expect(res.status).toBe(200);
    return res.body.accessToken as string;
  }

  const buyerRestore = {
    firstName: 'Rahim',
    lastName: 'Hossain',
    email: 'buyer@pharmex.bd',
    phone: '+919876543210',
  };

  async function restoreBuyer(token: string) {
    await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send(buyerRestore);
  }

  it('updates language, theme, and notification preferences', async () => {
    const token = await loginBuyer();

    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        language: 'bn',
        theme: 'dark',
        notificationPrefs: { promotions: true, chat: false },
      });

    expect(res.status).toBe(200);
    expect(res.body.language).toBe('bn');
    expect(res.body.theme).toBe('dark');
    expect(res.body.notificationPrefs.promotions).toBe(true);
    expect(res.body.notificationPrefs.chat).toBe(false);
  });

  it('updates name, email, and normalizes phone to +91 E.164', async () => {
    const token = await loginBuyer();
    const uniqueEmail = `buyer-profile-${Date.now()}@example.com`;

    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Updated',
        lastName: 'Buyer',
        email: uniqueEmail,
        phone: '9876543210',
      });

    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('Updated');
    expect(res.body.lastName).toBe('Buyer');
    expect(res.body.email).toBe(uniqueEmail);
    expect(res.body.phone).toBe('+919876543210');

    await restoreBuyer(token);
  });

  it('normalizes 0-prefixed and 91-prefixed Indian numbers', async () => {
    const token = await loginSeller();

    const zeroPrefixed = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '09153014194' });
    expect(zeroPrefixed.status).toBe(200);
    expect(zeroPrefixed.body.phone).toBe('+919153014194');

    const countryPrefixed = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '919153014194' });
    expect(countryPrefixed.status).toBe(200);
    expect(countryPrefixed.body.phone).toBe('+919153014194');
  });

  it('preserves explicit international phone numbers', async () => {
    const token = await loginBuyer();

    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+14155552671' });

    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('+14155552671');

    await restoreBuyer(token);
  });

  it('rejects duplicate email', async () => {
    const token = await loginBuyer();

    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'seller@pharmex.bd' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects duplicate phone', async () => {
    const token = await loginBuyer();

    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+919153014194' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/phone/i);
  });

  it('rejects unauthenticated profile updates', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me')
      .send({ firstName: 'Hacker' });

    expect(res.status).toBe(401);
  });
});
