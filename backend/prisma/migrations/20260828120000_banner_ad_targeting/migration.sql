-- Banner advertisement targeting and approval workflow

CREATE TYPE "BannerType" AS ENUM ('ADMIN', 'SELLER_AD');
CREATE TYPE "BannerStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAUSED', 'EXPIRED');
CREATE TYPE "BannerTargetType" AS ENUM ('WORLDWIDE', 'COUNTRY', 'REGION', 'CITY', 'RADIUS');

ALTER TABLE "HomeBanner" ADD COLUMN "bannerType" "BannerType" NOT NULL DEFAULT 'ADMIN';
ALTER TABLE "HomeBanner" ADD COLUMN "advertiserPharmacyId" TEXT;
ALTER TABLE "HomeBanner" ADD COLUMN "status" "BannerStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "HomeBanner" ADD COLUMN "targetType" "BannerTargetType" NOT NULL DEFAULT 'WORLDWIDE';
ALTER TABLE "HomeBanner" ADD COLUMN "targetCountry" TEXT;
ALTER TABLE "HomeBanner" ADD COLUMN "targetState" TEXT;
ALTER TABLE "HomeBanner" ADD COLUMN "targetCity" TEXT;
ALTER TABLE "HomeBanner" ADD COLUMN "targetLatitude" DOUBLE PRECISION;
ALTER TABLE "HomeBanner" ADD COLUMN "targetLongitude" DOUBLE PRECISION;
ALTER TABLE "HomeBanner" ADD COLUMN "radiusKm" DOUBLE PRECISION;
ALTER TABLE "HomeBanner" ADD COLUMN "startsAt" TIMESTAMP(3);
ALTER TABLE "HomeBanner" ADD COLUMN "endsAt" TIMESTAMP(3);
ALTER TABLE "HomeBanner" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "HomeBanner" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "HomeBanner" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "HomeBanner" ADD COLUMN "approvedAt" TIMESTAMP(3);

-- Migrate existing banners: active admin worldwide promotions
UPDATE "HomeBanner"
SET
  "bannerType" = 'ADMIN',
  "targetType" = 'WORLDWIDE',
  "status" = CASE WHEN "isActive" = true THEN 'ACTIVE'::"BannerStatus" ELSE 'PAUSED'::"BannerStatus" END,
  "priority" = "sortOrder"
WHERE "bannerType" = 'ADMIN';

CREATE INDEX "HomeBanner_status_bannerType_idx" ON "HomeBanner"("status", "bannerType");
CREATE INDEX "HomeBanner_targetType_idx" ON "HomeBanner"("targetType");
CREATE INDEX "HomeBanner_advertiserPharmacyId_idx" ON "HomeBanner"("advertiserPharmacyId");

ALTER TABLE "HomeBanner" ADD CONSTRAINT "HomeBanner_advertiserPharmacyId_fkey"
  FOREIGN KEY ("advertiserPharmacyId") REFERENCES "Pharmacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HomeBanner" ADD CONSTRAINT "HomeBanner_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
