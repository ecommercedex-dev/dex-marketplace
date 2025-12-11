import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import crypto from "crypto";
import DOMPurify from "isomorphic-dompurify";

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send phone verification via email
export const sendPhoneVerificationEmail = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    if (seller.phoneVerified) return res.status(400).json({ message: "Phone already verified" });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.seller.update({
      where: { id: sellerId },
      data: { 
        phoneVerificationCode: verificationCode,
        phoneVerificationExpiry: expiresAt
      }
    });

    await transporter.sendMail({
      from: `"DEX Verification" <${process.env.EMAIL_USER}>`,
      to: seller.email,
      subject: "📱 DEX Phone Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50, #45a049); padding: 30px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0;">📱 Phone Verification</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">DEX Marketplace</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${DOMPurify.sanitize(seller.name)}! 👋</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              To verify your phone number <strong>${seller.phone}</strong>, please enter this code in your verification dashboard:
            </p>
            
            <div style="background: white; border: 2px dashed #4CAF50; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h1 style="color: #4CAF50; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
              <p style="color: #888; margin: 10px 0 0 0; font-size: 14px;">Valid for 15 minutes</p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              ✅ <strong>Why verify your phone?</strong><br>
              • Build trust with buyers<br>
              • Unlock higher search visibility<br>
              • Enable safety features
            </p>
          </div>
          
          <div style="text-align: center; color: #888; font-size: 12px;">
            <p>This code expires in 15 minutes. If you didn't request this, please ignore this email.</p>
            <p style="margin-top: 10px;">© 2024 DEX Marketplace - Safe Campus Trading</p>
          </div>
        </div>
      `
    });

    res.json({ message: "Phone verification code sent to your email" });
  } catch (error) {
    console.error("Phone verification email error:", error);
    res.status(500).json({ message: "Failed to send verification email" });
  }
};

// Send emergency contact verification via email
export const sendEmergencyVerificationEmail = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    if (!seller.emergencyContact) return res.status(400).json({ message: "No emergency contact set" });

    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.seller.update({
      where: { id: sellerId },
      data: { 
        emergencyVerificationCode: verificationCode,
        emergencyVerificationExpiry: expiresAt
      }
    });

    await transporter.sendMail({
      from: `"DEX Safety Team" <${process.env.EMAIL_USER}>`,
      to: seller.email,
      subject: "🚨 DEX Emergency Contact Verification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #FF9800, #F57C00); padding: 30px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0;">🚨 Emergency Contact Verification</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">DEX Safety System</p>
          </div>
          
          <div style="background: #fff3e0; padding: 30px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #FF9800;">
            <h2 style="color: #333; margin-bottom: 20px;">Safety First! 🛡️</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Please contact your emergency contact <strong>${seller.emergencyContact}</strong> and ask them to confirm they agree to be your emergency contact for DEX marketplace.
            </p>
            
            <div style="background: white; border: 2px solid #FF9800; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #FF9800; margin-bottom: 10px;">Instructions:</h3>
              <ol style="color: #666; line-height: 1.8;">
                <li>Call or message your emergency contact: <strong>${seller.emergencyContact}</strong></li>
                <li>Ask them to confirm they agree to be your emergency contact</li>
                <li>Give them this verification code: <strong style="color: #FF9800; font-size: 18px;">${verificationCode}</strong></li>
                <li>Enter the code in your verification dashboard</li>
              </ol>
            </div>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                <strong>Why this matters:</strong> Your emergency contact helps ensure your safety during meetups and can be reached if needed during transactions.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; color: #888; font-size: 12px;">
            <p>This verification expires in 30 minutes.</p>
            <p style="margin-top: 10px;">© 2024 DEX Marketplace - Your Safety is Our Priority</p>
          </div>
        </div>
      `
    });

    res.json({ 
      message: "Emergency contact verification instructions sent to your email",
      note: "Please contact your emergency contact and get the verification code"
    });
  } catch (error) {
    console.error("Emergency verification email error:", error);
    res.status(500).json({ message: "Failed to send verification email" });
  }
};

// Send campus verification instructions via email
export const sendCampusVerificationEmail = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { verificationType } = req.body;
    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    const verificationInstructions = {
      student_id: {
        title: "🎓 Student ID Verification",
        docs: "Current student ID card (both sides)",
        note: "Must show current enrollment status"
      },
      staff_id: {
        title: "👨‍🏫 Staff/Faculty Verification", 
        docs: "Staff/Faculty ID card or employment letter",
        note: "Must show current employment status"
      },
      alumni: {
        title: "🎓 Alumni Verification",
        docs: "Graduation certificate or alumni card",
        note: "Must show graduation from the institution"
      },
      address_proof: {
        title: "🏠 Campus Address Verification",
        docs: "Utility bill or lease agreement showing campus address",
        note: "Must be within campus vicinity"
      }
    };

    const verification = verificationInstructions[verificationType];

    await transporter.sendMail({
      from: `"DEX Verification Team" <${process.env.EMAIL_USER}>`,
      to: seller.email,
      subject: `${verification.title} - Upload Instructions`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #9C27B0, #7B1FA2); padding: 30px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0;">${verification.title}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">DEX Campus Verification</p>
          </div>
          
          <div style="background: #f3e5f5; padding: 30px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${DOMPurify.sanitize(seller.name)}! 👋</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              To complete your campus verification, please upload the following document(s):
            </p>
            
            <div style="background: white; border-left: 5px solid #9C27B0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #9C27B0; margin-bottom: 15px;">Required Document:</h3>
              <p style="color: #333; font-weight: bold; margin-bottom: 10px;">${verification.docs}</p>
              <p style="color: #666; font-style: italic;">${verification.note}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #4CAF50; margin-bottom: 15px;">📋 Upload Guidelines:</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Clear, readable photo or scan</li>
                <li>All text must be visible</li>
                <li>Accepted formats: JPG, PNG, PDF</li>
                <li>Maximum file size: 5MB</li>
                <li>No personal information will be shared</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/DEX_HOMEPAGES/PROFILE_PAGES/seller_verification.html" 
                 style="background: #9C27B0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                📤 Upload Document Now
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #888; font-size: 12px;">
            <p>Documents are reviewed within 24 hours. Your privacy is protected.</p>
            <p style="margin-top: 10px;">© 2024 DEX Marketplace - Building Campus Trust</p>
          </div>
        </div>
      `
    });

    res.json({ message: "Campus verification instructions sent to your email" });
  } catch (error) {
    console.error("Campus verification email error:", error);
    res.status(500).json({ message: "Failed to send verification email" });
  }
};