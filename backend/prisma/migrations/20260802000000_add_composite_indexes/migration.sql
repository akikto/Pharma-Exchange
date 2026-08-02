# CreateDate: 20260802000000

-- Composite indexes for marketplace queries
CREATE INDEX IF NOT EXISTS "Listing_status_expiryDate_idx" ON "Listing"("status", "expiryDate");
CREATE INDEX IF NOT EXISTS "Listing_status_finalPrice_idx" ON "Listing"("status", "finalPrice");
CREATE INDEX IF NOT EXISTS "BuyRequest_buyerId_status_idx" ON "BuyRequest"("buyerId", "status");
CREATE INDEX IF NOT EXISTS "BuyRequest_sellerId_status_idx" ON "BuyRequest"("sellerId", "status");
CREATE INDEX IF NOT EXISTS "Order_buyerId_status_idx" ON "Order"("buyerId", "status");
CREATE INDEX IF NOT EXISTS "Order_sellerId_status_idx" ON "Order"("sellerId", "status");
