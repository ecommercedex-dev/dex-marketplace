-- Enhanced Seller Schema for Safety and Anti-Scam Features

-- Add new columns to existing Seller table
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN DEFAULT false;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "phoneVerificationCode" TEXT;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "phoneVerificationExpiry" TIMESTAMP;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "reputationScore" INTEGER DEFAULT 0;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "verificationLevel" TEXT DEFAULT 'basic';
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "trustBadges" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "suspiciousFlags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "lastActivityCheck" TIMESTAMP DEFAULT NOW();
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "businessLicense" TEXT;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "businessLicenseVerified" BOOLEAN DEFAULT false;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "bankAccountVerified" BOOLEAN DEFAULT false;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "identityDocumentPath" TEXT;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "identityVerified" BOOLEAN DEFAULT false;

-- Create Seller Verification Documents table
CREATE TABLE IF NOT EXISTS "SellerVerificationDocument" (
    "id" SERIAL PRIMARY KEY,
    "sellerId" INTEGER NOT NULL REFERENCES "Seller"("id") ON DELETE CASCADE,
    "documentType" TEXT NOT NULL, -- 'student_id', 'business_license', 'identity_card', 'bank_statement'
    "documentPath" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    "uploadedAt" TIMESTAMP DEFAULT NOW(),
    "reviewedAt" TIMESTAMP,
    "reviewedBy" INTEGER, -- Admin ID
    "reviewNotes" TEXT,
    "expiryDate" TIMESTAMP,
    UNIQUE("sellerId", "documentType")
);

-- Create Seller Reputation History table
CREATE TABLE IF NOT EXISTS "SellerReputationHistory" (
    "id" SERIAL PRIMARY KEY,
    "sellerId" INTEGER NOT NULL REFERENCES "Seller"("id") ON DELETE CASCADE,
    "previousScore" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "changeReason" TEXT NOT NULL, -- 'review_received', 'order_completed', 'violation_penalty', etc.
    "changedBy" TEXT, -- 'system', 'admin', 'user_action'
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create Fraud Detection Logs table
CREATE TABLE IF NOT EXISTS "FraudDetectionLog" (
    "id" SERIAL PRIMARY KEY,
    "sellerId" INTEGER NOT NULL REFERENCES "Seller"("id") ON DELETE CASCADE,
    "flagType" TEXT NOT NULL, -- 'unusual_pricing', 'high_cancellation', 'duplicate_info', etc.
    "severity" TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    "description" TEXT,
    "autoResolved" BOOLEAN DEFAULT false,
    "resolvedBy" INTEGER, -- Admin ID
    "resolvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create Seller Safety Confirmations table
CREATE TABLE IF NOT EXISTS "SellerSafetyConfirmation" (
    "id" SERIAL PRIMARY KEY,
    "sellerId" INTEGER NOT NULL REFERENCES "Seller"("id") ON DELETE CASCADE,
    "confirmationType" TEXT NOT NULL, -- 'safety_guidelines', 'anti_scam_policy', 'terms_of_service'
    "confirmedAt" TIMESTAMP DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    UNIQUE("sellerId", "confirmationType")
);

-- Create Business Verification table
CREATE TABLE IF NOT EXISTS "BusinessVerification" (
    "id" SERIAL PRIMARY KEY,
    "sellerId" INTEGER NOT NULL REFERENCES "Seller"("id") ON DELETE CASCADE,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "businessAddress" TEXT NOT NULL,
    "businessPhone" TEXT,
    "businessEmail" TEXT,
    "verificationStatus" TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    "verifiedAt" TIMESTAMP,
    "verifiedBy" INTEGER, -- Admin ID
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Seller Trust Metrics table
CREATE TABLE IF NOT EXISTS "SellerTrustMetric" (
    "id" SERIAL PRIMARY KEY,
    "sellerId" INTEGER NOT NULL REFERENCES "Seller"("id") ON DELETE CASCADE,
    "metricType" TEXT NOT NULL, -- 'response_time', 'order_fulfillment', 'customer_satisfaction', etc.
    "value" DECIMAL(5,2) NOT NULL,
    "calculatedAt" TIMESTAMP DEFAULT NOW(),
    "validUntil" TIMESTAMP,
    UNIQUE("sellerId", "metricType")
);

-- Create Seller Penalty System table
CREATE TABLE IF NOT EXISTS "SellerPenalty" (
    "id" SERIAL PRIMARY KEY,
    "sellerId" INTEGER NOT NULL REFERENCES "Seller"("id") ON DELETE CASCADE,
    "penaltyType" TEXT NOT NULL, -- 'warning', 'temporary_suspension', 'permanent_ban', 'reputation_deduction'
    "reason" TEXT NOT NULL,
    "severity" TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    "issuedBy" INTEGER NOT NULL, -- Admin ID
    "issuedAt" TIMESTAMP DEFAULT NOW(),
    "expiresAt" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "appealStatus" TEXT DEFAULT 'none' -- 'none', 'pending', 'approved', 'rejected'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_seller_reputation_score" ON "Seller"("reputationScore");
CREATE INDEX IF NOT EXISTS "idx_seller_verification_level" ON "Seller"("verificationLevel");
CREATE INDEX IF NOT EXISTS "idx_seller_trust_badges" ON "Seller" USING GIN("trustBadges");
CREATE INDEX IF NOT EXISTS "idx_seller_suspicious_flags" ON "Seller" USING GIN("suspiciousFlags");
CREATE INDEX IF NOT EXISTS "idx_verification_document_status" ON "SellerVerificationDocument"("status");
CREATE INDEX IF NOT EXISTS "idx_fraud_log_severity" ON "FraudDetectionLog"("severity");
CREATE INDEX IF NOT EXISTS "idx_seller_penalty_active" ON "SellerPenalty"("isActive");

-- Create triggers for automatic reputation updates
CREATE OR REPLACE FUNCTION update_seller_reputation_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.reputationScore IS DISTINCT FROM NEW.reputationScore THEN
        INSERT INTO "SellerReputationHistory" ("sellerId", "previousScore", "newScore", "changeReason", "changedBy")
        VALUES (NEW.id, OLD.reputationScore, NEW.reputationScore, 'system_update', 'system');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seller_reputation_history_trigger
    AFTER UPDATE ON "Seller"
    FOR EACH ROW
    EXECUTE FUNCTION update_seller_reputation_history();

-- Insert default safety confirmation types
INSERT INTO "SellerSafetyConfirmation" ("sellerId", "confirmationType") 
SELECT id, 'safety_guidelines' FROM "Seller" WHERE "safetyConfirmed" = true
ON CONFLICT DO NOTHING;

INSERT INTO "SellerSafetyConfirmation" ("sellerId", "confirmationType") 
SELECT id, 'anti_scam_policy' FROM "Seller" WHERE "antiScamConfirmed" = true
ON CONFLICT DO NOTHING;

-- Update existing sellers with basic verification level
UPDATE "Seller" SET "verificationLevel" = 'basic' WHERE "verificationLevel" IS NULL;

-- Add trust badges for existing verified sellers
UPDATE "Seller" SET "trustBadges" = ARRAY['email_verified'] WHERE "isVerified" = true;
UPDATE "Seller" SET "trustBadges" = array_append("trustBadges", 'student_verified') WHERE "studentConfirmed" = true;
UPDATE "Seller" SET "trustBadges" = array_append("trustBadges", 'safety_confirmed') WHERE "safetyConfirmed" = true;