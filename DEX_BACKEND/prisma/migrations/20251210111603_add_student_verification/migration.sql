-- CreateTable
CREATE TABLE "student_verifications" (
    "id" SERIAL NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "documentPath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" INTEGER,

    CONSTRAINT "student_verifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "student_verifications" ADD CONSTRAINT "student_verifications_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
