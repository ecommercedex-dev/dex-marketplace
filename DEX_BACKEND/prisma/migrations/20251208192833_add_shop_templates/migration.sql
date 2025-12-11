-- CreateTable
CREATE TABLE "ShopTemplate" (
    "id" SERIAL NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "shopSettingsId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "bannerConfig" JSONB,
    "logoType" TEXT,
    "logoText" TEXT,
    "logoIcon" TEXT,
    "logoTextColor" TEXT,
    "logoIconColor" TEXT,
    "logoBackgroundColor" TEXT,
    "logoFont" TEXT,
    "logoLayout" TEXT,
    "primaryColor" TEXT,
    "accentColor" TEXT,
    "tagline" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShopTemplate_sellerId_idx" ON "ShopTemplate"("sellerId");

-- AddForeignKey
ALTER TABLE "ShopTemplate" ADD CONSTRAINT "ShopTemplate_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopTemplate" ADD CONSTRAINT "ShopTemplate_shopSettingsId_fkey" FOREIGN KEY ("shopSettingsId") REFERENCES "ShopSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
