-- CreateEnum (idempotent for preview DBs that already received schema via db push)
DO $$ BEGIN
    CREATE TYPE "ItemDeliveryMode" AS ENUM ('BUYER_PICKUP', 'SELLER_DELIVERS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "indications" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "dosageInstructions" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "sideEffects" TEXT;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "deliveryMode" "ItemDeliveryMode" NOT NULL DEFAULT 'SELLER_DELIVERS';
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "estimatedDeliveryDays" INTEGER;
