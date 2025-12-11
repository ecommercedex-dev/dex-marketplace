import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Simple phone verification without SMS (for V1 testing)
export const sendPhoneVerification = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    if (seller.phoneVerified) return res.status(400).json({ message: "Phone already verified" });

    // Generate simple 4-digit code for testing
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.seller.update({
      where: { id: sellerId },
      data: { 
        phoneVerificationCode: verificationCode,
        phoneVerificationExpiry: expiresAt
      }
    });

    // For V1: Just return the code (in production, this would be sent via SMS)
    res.json({ 
      message: "Verification code generated",
      code: verificationCode, // Remove this in production
      note: "In production, this code would be sent via SMS"
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    res.status(500).json({ message: "Failed to generate verification code" });
  }
};

// Verify phone code (same as before)
export const verifyPhoneCode = async (req, res) => {
  try {
    const { code } = req.body;
    const sellerId = req.user.id;

    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    if (seller.phoneVerificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (new Date() > seller.phoneVerificationExpiry) {
      return res.status(400).json({ message: "Verification code expired" });
    }

    await prisma.seller.update({
      where: { id: sellerId },
      data: {
        phoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationExpiry: null
      }
    });

    res.json({ 
      message: "Phone verified successfully!",
      badge: "📱 Phone Verified"
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};