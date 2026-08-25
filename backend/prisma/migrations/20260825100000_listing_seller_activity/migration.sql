-- Seller activity tracking for stale listing auto-expiry
ALTER TABLE "Listing" ADD COLUMN "lastSellerActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Listing" ADD COLUMN "staleListingReminderSentAt" TIMESTAMP(3);

UPDATE "Listing" SET "lastSellerActivityAt" = "updatedAt";

CREATE INDEX "Listing_lastSellerActivityAt_status_idx" ON "Listing"("status", "lastSellerActivityAt");
