-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" SERIAL NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "bannerImage" TEXT,
    "shopLogo" TEXT,
    "tagline" TEXT,
    "aboutShop" TEXT,
    "primaryColor" TEXT DEFAULT '#6ecf45',
    "accentColor" TEXT DEFAULT '#2b7a0b',
    "featuredProducts" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "announcement" TEXT,
    "showAnnouncement" BOOLEAN NOT NULL DEFAULT false,
    "socialLinks" JSONB,
    "businessHours" TEXT,
    "returnPolicy" TEXT,
    "paymentMethods" TEXT,
    "gridColumns" INTEGER NOT NULL DEFAULT 3,
    "showFilters" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_sellerId_key" ON "ShopSettings"("sellerId");

-- AddForeignKey
ALTER TABLE "ShopSettings" ADD CONSTRAINT "ShopSettings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
