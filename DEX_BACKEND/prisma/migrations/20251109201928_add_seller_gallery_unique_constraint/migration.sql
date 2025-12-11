/*
  Warnings:

  - A unique constraint covering the columns `[sellerId,url]` on the table `SellerGalleryImage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SellerGalleryImage_sellerId_url_key" ON "SellerGalleryImage"("sellerId", "url");
