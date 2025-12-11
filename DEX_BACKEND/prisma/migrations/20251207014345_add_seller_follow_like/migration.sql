-- CreateTable
CREATE TABLE "SellerFollow" (
    "id" SERIAL NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerLike" (
    "id" SERIAL NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerFollow_buyerId_sellerId_key" ON "SellerFollow"("buyerId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerLike_buyerId_sellerId_key" ON "SellerLike"("buyerId", "sellerId");

-- AddForeignKey
ALTER TABLE "SellerFollow" ADD CONSTRAINT "SellerFollow_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerFollow" ADD CONSTRAINT "SellerFollow_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerLike" ADD CONSTRAINT "SellerLike_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerLike" ADD CONSTRAINT "SellerLike_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
