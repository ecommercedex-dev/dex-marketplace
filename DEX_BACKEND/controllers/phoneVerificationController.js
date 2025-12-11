import { PrismaClient } from "@prisma/client";
import twilio from "twilio";
import crypto from "crypto";

const prisma = new PrismaClient();
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Send phone verification code
export const sendPhoneVerification = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    if (seller.phoneVerified) return res.status(400).json({ message: "Phone already verified" });

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code in database
    await prisma.seller.update({
      where: { id: sellerId },
      data: { 
        phoneVerificationCode: verificationCode,
        phoneVerificationExpiry: expiresAt
      }
    });

    // Send SMS
    await twilioClient.messages.create({
      body: `DEX Verification Code: ${verificationCode}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE,
      to: seller.phone
    });

    res.json({ message: "Verification code sent to your phone" });
  } catch (error) {
    console.error("Phone verification error:", error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
};

// Verify phone code
export const verifyPhoneCode = async (req, res) => {
  try {
    const { code } = req.body;
    const sellerId = req.user.id;

    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Check code and expiry
    if (seller.phoneVerificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (new Date() > seller.phoneVerificationExpiry) {
      return res.status(400).json({ message: "Verification code expired" });
    }

    // Mark phone as verified
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