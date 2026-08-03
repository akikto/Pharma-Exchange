-- CreateEnum
CREATE TYPE "PriceTrend" AS ENUM ('UP', 'DOWN', 'STABLE');

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "maxPrice" DECIMAL(12,2) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TriggeredAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "priceAlertId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "listingId" TEXT,
    "listingPrice" DECIMAL(12,2) NOT NULL,
    "maxPrice" DECIMAL(12,2) NOT NULL,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "isSimulated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriggeredAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_userId_medicineId_key" ON "WatchlistItem"("userId", "medicineId");
CREATE INDEX "WatchlistItem_userId_idx" ON "WatchlistItem"("userId");

CREATE UNIQUE INDEX "PriceAlert_userId_medicineId_key" ON "PriceAlert"("userId", "medicineId");
CREATE INDEX "PriceAlert_userId_idx" ON "PriceAlert"("userId");
CREATE INDEX "PriceAlert_medicineId_isEnabled_idx" ON "PriceAlert"("medicineId", "isEnabled");

CREATE INDEX "TriggeredAlert_userId_isDismissed_idx" ON "TriggeredAlert"("userId", "isDismissed");
CREATE INDEX "TriggeredAlert_createdAt_idx" ON "TriggeredAlert"("createdAt");

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TriggeredAlert" ADD CONSTRAINT "TriggeredAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TriggeredAlert" ADD CONSTRAINT "TriggeredAlert_priceAlertId_fkey" FOREIGN KEY ("priceAlertId") REFERENCES "PriceAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TriggeredAlert" ADD CONSTRAINT "TriggeredAlert_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TriggeredAlert" ADD CONSTRAINT "TriggeredAlert_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
