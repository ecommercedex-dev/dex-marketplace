import { PrismaClient } from "@prisma/client";
import twilio from "twilio";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send emergency contact verification
export const verifyEmergencyContact = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { method } = req.body; // 'sms' or 'call'
    
    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    if (!seller.emergencyContact) return res.status(400).json({ message: "No emergency contact set" });

    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit for calls
    
    if (method === 'sms') {
      await twilioClient.messages.create({
        body: `DEX Safety: ${seller.name} listed you as emergency contact. Reply YES to confirm. Code: ${verificationCode}`,
        from: process.env.TWILIO_PHONE,
        to: seller.emergencyContact
      });
    } else if (method === 'call') {
      await twilioClient.calls.create({
        twiml: `<Response><Say>Hello, this is DEX marketplace. ${seller.name} has listed you as their emergency contact. If you agree, press ${verificationCode}</Say></Response>`,
        from: process.env.TWILIO_PHONE,
        to: seller.emergencyContact
      });
    }

    // Store verification attempt
    await prisma.seller.update({
      where: { id: sellerId },
      data: { 
        emergencyVerificationCode: verificationCode,
        emergencyVerificationExpiry: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      }
    });

    res.json({ message: `Emergency contact verification sent via ${method}` });
  } catch (error) {
    console.error("Emergency contact verification error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// Confirm emergency contact verification
export const confirmEmergencyContact = async (req, res) => {
  try {
    const { code } = req.body;
    const sellerId = req.user.id;

    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    if (seller.emergencyVerificationCode !== code || new Date() > seller.emergencyVerificationExpiry) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    await prisma.seller.update({
      where: { id: sellerId },
      data: {
        emergencyContactVerified: true,
        emergencyVerificationCode: null,
        emergencyVerificationExpiry: null
      }
    });

    res.json({ 
      message: "Emergency contact verified!",
      badge: "🚨 Emergency Contact Verified"
    });
  } catch (error) {
    res.status(500).json({ message: "Verification failed" });
  }
};