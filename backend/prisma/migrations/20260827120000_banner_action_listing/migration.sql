-- AlterEnum
DO $$ BEGIN
    ALTER TYPE "BannerActionType" ADD VALUE 'LISTING';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
