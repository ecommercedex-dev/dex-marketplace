-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN     "deliveryInfo" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "productBadges" BOOLEAN NOT NULL DEFAULT true;
