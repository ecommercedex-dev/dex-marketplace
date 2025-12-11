-- AlterTable
ALTER TABLE "Buyer" ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "studentVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "OrderMessage" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "senderType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerSettings" (
    "id" SERIAL NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "profileVisibility" TEXT NOT NULL DEFAULT 'public',
    "contactPrefs" TEXT NOT NULL DEFAULT 'everyone',
    "showRealName" BOOLEAN NOT NULL DEFAULT false,
    "meetingLocations" TEXT,
    "emergencyContact" TEXT,
    "showTrustScore" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" SERIAL NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "reportedUserId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderMessage_orderId_idx" ON "OrderMessage"("orderId");

-- CreateIndex
CREATE INDEX "OrderMessage_orderId_read_idx" ON "OrderMessage"("orderId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerSettings_buyerId_key" ON "BuyerSettings"("buyerId");

-- CreateIndex
CREATE INDEX "UserReport_reporterId_idx" ON "UserReport"("reporterId");

-- CreateIndex
CREATE INDEX "UserReport_reportedUserId_idx" ON "UserReport"("reportedUserId");

-- CreateIndex
CREATE INDEX "UserReport_status_idx" ON "UserReport"("status");

-- AddForeignKey
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerSettings" ADD CONSTRAINT "BuyerSettings_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
