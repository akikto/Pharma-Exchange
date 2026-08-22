-- CreateEnum
CREATE TYPE "BannerMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "BannerActionType" AS ENUM ('NONE', 'EXTERNAL_URL', 'INTERNAL_PATH', 'MEDICINE', 'PHARMACY', 'CATEGORY');

-- CreateTable
CREATE TABLE "HomeBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" "BannerMediaType" NOT NULL,
    "mediaAlt" TEXT,
    "ctaText" TEXT,
    "actionType" "BannerActionType" NOT NULL DEFAULT 'NONE',
    "actionTarget" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeBanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeBanner_isActive_sortOrder_idx" ON "HomeBanner"("isActive", "sortOrder");
