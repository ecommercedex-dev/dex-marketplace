-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "availability" TEXT,
ADD COLUMN     "bookedAt" TIMESTAMP(3),
ADD COLUMN     "bookedBy" INTEGER,
ADD COLUMN     "bookingNotes" TEXT,
ADD COLUMN     "bookingStatus" TEXT DEFAULT 'none',
ADD COLUMN     "caretakerPhone" TEXT,
ADD COLUMN     "distanceFromCampus" DOUBLE PRECISION,
ADD COLUMN     "isHostel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "roomType" TEXT,
ALTER COLUMN "stock" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Product_sellerId_idx" ON "Product"("sellerId");

-- CreateIndex
CREATE INDEX "Product_isHostel_idx" ON "Product"("isHostel");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_deployed_idx" ON "Product"("deployed");
