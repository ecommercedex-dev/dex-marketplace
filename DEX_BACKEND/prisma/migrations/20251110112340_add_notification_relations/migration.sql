-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "buyerId" INTEGER,
    "sellerId" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_buyerId_idx" ON "Notification"("buyerId");

-- CreateIndex
CREATE INDEX "Notification_sellerId_idx" ON "Notification"("sellerId");

-- CreateIndex
CREATE INDEX "Notification_buyerId_read_idx" ON "Notification"("buyerId", "read");

-- CreateIndex
CREATE INDEX "Notification_sellerId_read_idx" ON "Notification"("sellerId", "read");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;
