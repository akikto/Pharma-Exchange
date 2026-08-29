import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import {
  BannerActionType,
  BannerMediaType,
  BannerStatus,
  BannerTargetType,
  BannerType,
} from '@prisma/client';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';

async function isDatabaseAvailable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe('Banner advertisement targeting API', () => {
  const app = createApp();
  let dbAvailable = false;
  let adminToken = '';
  let buyerToken = '';
  let sellerToken = '';
  let sellerPharmacyId = '';
  let sellerListingId = '';
  let otherListingId = '';
  const createdIds: string[] = [];

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;

    const admin = await prisma.user.findUnique({ where: { email: 'admin@pharmex.bd' } });
    const buyer = await prisma.user.findUnique({ where: { email: 'buyer@pharmex.bd' } });
    const seller = await prisma.user.findUnique({ where: { email: 'seller@pharmex.bd' } });
    if (!admin || !buyer || !seller) return;

    adminToken = signAccessToken({ userId: admin.id, role: admin.role });
    buyerToken = signAccessToken({ userId: buyer.id, role: buyer.role });
    sellerToken = signAccessToken({ userId: seller.id, role: seller.role });

    const sellerPharmacy = await prisma.pharmacy.findUnique({ where: { userId: seller.id } });
    sellerPharmacyId = sellerPharmacy?.id ?? '';

    const sellerListing = await prisma.listing.findFirst({
      where: { pharmacyId: sellerPharmacyId },
      select: { id: true },
    });
    sellerListingId = sellerListing?.id ?? '';

    const otherListing = await prisma.listing.findFirst({
      where: sellerPharmacyId ? { pharmacyId: { not: sellerPharmacyId } } : undefined,
      select: { id: true },
    });
    otherListingId = otherListing?.id ?? '';
  });

  afterAll(async () => {
    if (createdIds.length) {
      await prisma.homeBanner.deleteMany({ where: { id: { in: createdIds } } });
    }
  });

  async function createAdminBanner(payload: Record<string, unknown>) {
    const res = await request(app)
      .post('/api/v1/admin/banners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Admin Banner',
        mediaUrl: 'https://example.com/banner.jpg',
        mediaType: BannerMediaType.IMAGE,
        actionType: BannerActionType.NONE,
        isActive: true,
        ...payload,
      });
    if (res.status === 201) createdIds.push(res.body.id);
    return res;
  }

  it('rejects non-admin banner create', async ({ skip }) => {
    if (!dbAvailable || !buyerToken) skip();
    const res = await request(app)
      .post('/api/v1/admin/banners')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Test',
        mediaUrl: 'https://example.com/banner.jpg',
        mediaType: BannerMediaType.IMAGE,
        actionType: BannerActionType.NONE,
      });
    expect(res.status).toBe(403);
  });

  it('admin creates worldwide, country, state, city, and radius banners', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();

    const worldwide = await createAdminBanner({ title: 'Worldwide', targetType: BannerTargetType.WORLDWIDE });
    expect(worldwide.status).toBe(201);

    const country = await createAdminBanner({
      title: 'India',
      targetType: BannerTargetType.COUNTRY,
      targetCountry: 'India',
    });
    expect(country.status).toBe(201);

    const region = await createAdminBanner({
      title: 'West Bengal',
      targetType: BannerTargetType.REGION,
      targetCountry: 'India',
      targetState: 'West Bengal',
    });
    expect(region.status).toBe(201);

    const city = await createAdminBanner({
      title: 'Berhampore',
      targetType: BannerTargetType.CITY,
      targetCountry: 'India',
      targetState: 'West Bengal',
      targetCity: 'Berhampore',
    });
    expect(city.status).toBe(201);

    const radius = await createAdminBanner({
      title: 'Radius',
      targetType: BannerTargetType.RADIUS,
      actionType: BannerActionType.PHARMACY,
      actionTarget: sellerPharmacyId,
      radiusKm: 25,
    });
    expect(radius.status).toBe(201);
    expect(radius.body.targetLatitude).toBeTruthy();
    expect(radius.body.targetLongitude).toBeTruthy();
  });

  it('verified seller can submit advertisement and buyer cannot', async ({ skip }) => {
    if (!dbAvailable || !sellerToken || !buyerToken || !sellerListingId) skip();

    const sellerRes = await request(app)
      .post('/api/v1/advertisements')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Seller Promo',
        mediaUrl: 'https://example.com/seller.jpg',
        mediaType: BannerMediaType.IMAGE,
        actionType: BannerActionType.LISTING,
        actionTarget: sellerListingId,
        targetType: BannerTargetType.CITY,
        targetCountry: 'India',
        targetState: 'West Bengal',
        targetCity: 'Berhampore',
      });
    expect(sellerRes.status).toBe(201);
    expect(sellerRes.body.status).toBe(BannerStatus.PENDING_APPROVAL);
    createdIds.push(sellerRes.body.id);

    const buyerRes = await request(app)
      .post('/api/v1/advertisements')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Buyer Promo',
        mediaUrl: 'https://example.com/buyer.jpg',
        mediaType: BannerMediaType.IMAGE,
        actionType: BannerActionType.PHARMACY,
        actionTarget: sellerPharmacyId,
        targetType: BannerTargetType.WORLDWIDE,
      });
    expect(buyerRes.status).toBe(403);
  });

  it('seller cannot advertise another seller listing', async ({ skip }) => {
    if (!dbAvailable || !sellerToken || !otherListingId) skip();
    const res = await request(app)
      .post('/api/v1/advertisements')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Bad Target',
        mediaUrl: 'https://example.com/bad.jpg',
        mediaType: BannerMediaType.IMAGE,
        actionType: BannerActionType.LISTING,
        actionTarget: otherListingId,
        targetType: BannerTargetType.WORLDWIDE,
      });
    expect(res.status).toBe(403);
  });

  it('pending, rejected, future, and expired ads are hidden from public banners', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();

    const pending = await createAdminBanner({
      title: 'Pending',
      bannerType: BannerType.SELLER_AD,
      status: BannerStatus.PENDING_APPROVAL,
      isActive: false,
      targetType: BannerTargetType.WORLDWIDE,
    });
    expect(pending.status).toBe(201);

    const rejected = await createAdminBanner({
      title: 'Rejected',
      bannerType: BannerType.SELLER_AD,
      status: BannerStatus.REJECTED,
      isActive: false,
      targetType: BannerTargetType.WORLDWIDE,
    });
    expect(rejected.status).toBe(201);

    const future = await createAdminBanner({
      title: 'Future',
      status: BannerStatus.ACTIVE,
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      targetType: BannerTargetType.WORLDWIDE,
    });
    expect(future.status).toBe(201);

    const expired = await createAdminBanner({
      title: 'Expired',
      status: BannerStatus.ACTIVE,
      endsAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      targetType: BannerTargetType.WORLDWIDE,
    });
    expect(expired.status).toBe(201);

    const publicList = await request(app).get('/api/v1/banners');
    expect(publicList.status).toBe(200);
    const ids = publicList.body.data.map((b: { id: string }) => b.id);
    expect(ids).not.toContain(pending.body.id);
    expect(ids).not.toContain(rejected.body.id);
    expect(ids).not.toContain(future.body.id);
    expect(ids).not.toContain(expired.body.id);
  });

  it('filters and ranks banners by location', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();

    const local = await createAdminBanner({
      title: 'Local Radius',
      targetType: BannerTargetType.RADIUS,
      actionType: BannerActionType.PHARMACY,
      actionTarget: sellerPharmacyId,
      radiusKm: 25,
      priority: 1,
    });
    const country = await createAdminBanner({
      title: 'India Wide',
      targetType: BannerTargetType.COUNTRY,
      targetCountry: 'India',
      priority: 100,
    });
    const bangladesh = await createAdminBanner({
      title: 'Bangladesh Only',
      targetType: BannerTargetType.COUNTRY,
      targetCountry: 'Bangladesh',
      priority: 100,
    });

    const res = await request(app).get('/api/v1/banners').query({
      latitude: 23.7461,
      longitude: 90.3742,
      country: 'Bangladesh',
      state: 'Dhaka',
      city: 'Dhaka',
    });
    expect(res.status).toBe(200);
    const ids = res.body.data.map((b: { id: string }) => b.id);
    expect(ids).toContain(local.body.id);
    expect(ids).toContain(country.body.id);
    expect(ids).not.toContain(bangladesh.body.id);
    expect(ids.indexOf(local.body.id)).toBeLessThan(ids.indexOf(country.body.id));
  });

  it('verified seller can create radius advertisement using shop location', async ({ skip }) => {
    if (!dbAvailable || !sellerToken || !sellerListingId) skip();

    const sellerRes = await request(app)
      .post('/api/v1/advertisements')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Radius Promo',
        mediaUrl: 'https://example.com/seller-radius.jpg',
        mediaType: BannerMediaType.IMAGE,
        actionType: BannerActionType.LISTING,
        actionTarget: sellerListingId,
        targetType: BannerTargetType.RADIUS,
        radiusKm: 10,
      });
    expect(sellerRes.status).toBe(201);
    expect(sellerRes.body.targetType).toBe(BannerTargetType.RADIUS);
    expect(sellerRes.body.radiusKm).toBe(10);
    expect(sellerRes.body.targetLatitude).toBeTruthy();
    expect(sellerRes.body.targetLongitude).toBeTruthy();
    createdIds.push(sellerRes.body.id);
  });

  it('rejects invalid radius values', async ({ skip }) => {
    if (!dbAvailable || !adminToken || !sellerPharmacyId) skip();

    const zero = await createAdminBanner({
      title: 'Bad Radius Zero',
      targetType: BannerTargetType.RADIUS,
      actionType: BannerActionType.PHARMACY,
      actionTarget: sellerPharmacyId,
      radiusKm: 0,
    });
    expect(zero.status).toBe(400);

    const tooLarge = await createAdminBanner({
      title: 'Bad Radius Large',
      targetType: BannerTargetType.RADIUS,
      actionType: BannerActionType.PHARMACY,
      actionTarget: sellerPharmacyId,
      radiusKm: 1001,
    });
    expect(tooLarge.status).toBe(400);
  });

  it('admin can approve and reject seller advertisements', async ({ skip }) => {
    if (!dbAvailable || !adminToken || !sellerToken || !sellerListingId) skip();

    const create = await request(app)
      .post('/api/v1/advertisements')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Review Me',
        mediaUrl: 'https://example.com/review.jpg',
        mediaType: BannerMediaType.IMAGE,
        actionType: BannerActionType.LISTING,
        actionTarget: sellerListingId,
        targetType: BannerTargetType.WORLDWIDE,
      });
    expect(create.status).toBe(201);
    createdIds.push(create.body.id);

    const reject = await request(app)
      .post(`/api/v1/admin/banners/${create.body.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rejectionReason: 'Not suitable' });
    expect(reject.status).toBe(200);
    expect(reject.body.status).toBe(BannerStatus.REJECTED);

    const create2 = await request(app)
      .post('/api/v1/advertisements')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Approve Me',
        mediaUrl: 'https://example.com/approve.jpg',
        mediaType: BannerMediaType.IMAGE,
        actionType: BannerActionType.LISTING,
        actionTarget: sellerListingId,
        targetType: BannerTargetType.WORLDWIDE,
      });
    expect(create2.status).toBe(201);
    createdIds.push(create2.body.id);

    const approve = await request(app)
      .post(`/api/v1/admin/banners/${create2.body.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approve.status).toBe(200);
    expect(approve.body.status).toBe(BannerStatus.ACTIVE);

    const publicList = await request(app).get('/api/v1/banners');
    expect(publicList.body.data.some((b: { id: string }) => b.id === create2.body.id)).toBe(true);
    expect(publicList.body.data.some((b: { id: string }) => b.id === create.body.id)).toBe(false);
  });

  it('preserves existing listing click action banners', async ({ skip }) => {
    if (!dbAvailable || !adminToken || !sellerListingId) skip();
    const create = await createAdminBanner({
      title: 'Listing CTA',
      actionType: BannerActionType.LISTING,
      actionTarget: sellerListingId,
      targetType: BannerTargetType.WORLDWIDE,
    });
    expect(create.status).toBe(201);
    expect(create.body.actionType).toBe(BannerActionType.LISTING);
    expect(create.body.actionTarget).toBe(sellerListingId);
  });
});
