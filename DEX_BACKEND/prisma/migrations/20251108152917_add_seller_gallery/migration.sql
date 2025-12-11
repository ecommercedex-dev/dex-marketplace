-- CreateTable
CREATE TABLE "SellerGalleryImage" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerGalleryImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SellerGalleryImage" ADD CONSTRAINT "SellerGalleryImage_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
