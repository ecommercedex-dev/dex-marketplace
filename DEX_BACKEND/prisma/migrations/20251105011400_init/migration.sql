-- CreateTable
CREATE TABLE "buyer" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
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

    CONSTRAINT "buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seller" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "productCategory" TEXT NOT NULL,
    "paymentInfo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'seller',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationCode" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "buyer_index_num_key" ON "buyer"("index_num");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_email_key" ON "buyer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_number_key" ON "buyer"("number");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_verificationToken_key" ON "buyer"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_verificationCode_key" ON "buyer"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_resetToken_key" ON "buyer"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_email_key" ON "Seller"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_phone_key" ON "Seller"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_storeName_key" ON "Seller"("storeName");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_authId_key" ON "Seller"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_paymentInfo_key" ON "Seller"("paymentInfo");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_verificationToken_key" ON "Seller"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_verificationCode_key" ON "Seller"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_resetToken_key" ON "Seller"("resetToken");
