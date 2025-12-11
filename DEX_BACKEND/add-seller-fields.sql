-- Add new fields to Seller table for enhanced safety and business info
ALTER TABLE "Seller" 
ADD COLUMN "businessDescription" TEXT,
ADD COLUMN "safetyConfirmed" BOOLEAN DEFAULT false,
ADD COLUMN "antiScamConfirmed" BOOLEAN DEFAULT false,
ADD COLUMN "studentConfirmed" BOOLEAN DEFAULT false;

-- Update existing sellers to have confirmed safety (optional)
-- UPDATE "Seller" SET "safetyConfirmed" = true, "antiScamConfirmed" = true, "studentConfirmed" = true WHERE "isVerified" = true;