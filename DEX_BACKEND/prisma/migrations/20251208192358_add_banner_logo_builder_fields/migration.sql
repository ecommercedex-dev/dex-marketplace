-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN     "bannerConfig" JSONB,
ADD COLUMN     "logoBackgroundColor" TEXT,
ADD COLUMN     "logoFont" TEXT,
ADD COLUMN     "logoIcon" TEXT,
ADD COLUMN     "logoIconColor" TEXT,
ADD COLUMN     "logoLayout" TEXT,
ADD COLUMN     "logoText" TEXT,
ADD COLUMN     "logoTextColor" TEXT,
ADD COLUMN     "logoType" TEXT;
