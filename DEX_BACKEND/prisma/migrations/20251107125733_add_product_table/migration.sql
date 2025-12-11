/*
  Warnings:

  - You are about to drop the `buyer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."buyer";

-- CreateTable
CREATE TABLE "Buyer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "index_num" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'buyer',
    "profilePic" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationCode" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "sellerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_index_num_key" ON "Buyer"("index_num");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_email_key" ON "Buyer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_number_key" ON "Buyer"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_verificationToken_key" ON "Buyer"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_verificationCode_key" ON "Buyer"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_resetToken_key" ON "Buyer"("resetToken");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
