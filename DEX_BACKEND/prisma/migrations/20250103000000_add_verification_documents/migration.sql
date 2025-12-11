-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" SERIAL NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "verificationType" TEXT NOT NULL,
    "primaryDocPath" TEXT,
    "secondaryDocPath" TEXT,
    "selfieDocPath" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "VerificationDocument_sellerId_idx" ON "VerificationDocument"("sellerId");
CREATE INDEX "VerificationDocument_status_idx" ON "VerificationDocument"("status");