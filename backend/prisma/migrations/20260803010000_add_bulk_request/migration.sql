-- CreateEnum
CREATE TYPE "BulkRequestUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "BulkExpiryPreset" AS ENUM ('THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS', 'SHORT_EXPIRY_OK', 'CUSTOM');
CREATE TYPE "BulkRequestStatus" AS ENUM ('OPEN', 'FULFILLED', 'CANCELLED');

-- CreateTable
CREATE TABLE "BulkRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "targetPrice" DECIMAL(12,2) NOT NULL,
    "urgency" "BulkRequestUrgency" NOT NULL DEFAULT 'NORMAL',
    "deliveryAddress" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "requiresColdChain" BOOLEAN NOT NULL DEFAULT false,
    "requiresVatInvoice" BOOLEAN NOT NULL DEFAULT false,
    "requiresFactorySealed" BOOLEAN NOT NULL DEFAULT false,
    "expiryPreset" "BulkExpiryPreset" NOT NULL,
    "customExpiryDays" INTEGER,
    "note" TEXT,
    "status" "BulkRequestStatus" NOT NULL DEFAULT 'OPEN',
    "listingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BulkRequest_requestNumber_key" ON "BulkRequest"("requestNumber");
CREATE UNIQUE INDEX "BulkRequest_listingId_key" ON "BulkRequest"("listingId");
CREATE INDEX "BulkRequest_pharmacyId_idx" ON "BulkRequest"("pharmacyId");
CREATE INDEX "BulkRequest_status_idx" ON "BulkRequest"("status");
CREATE INDEX "BulkRequest_createdAt_idx" ON "BulkRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "BulkRequest" ADD CONSTRAINT "BulkRequest_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BulkRequest" ADD CONSTRAINT "BulkRequest_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BulkRequest" ADD CONSTRAINT "BulkRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
