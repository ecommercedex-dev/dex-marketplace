import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import twilio from "twilio";
import { createNotification } from "./notificationController.js";
import DOMPurify from "isomorphic-dompurify";

dotenv.config();
const prisma = new PrismaClient();

// ================= Helper =================
const generateVerificationCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ================= Nodemailer =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ================= REGISTER SELLER (robust version) =================
export const registerSeller = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gender,
      storeName,
      businessType,
      businessAddress,
      productCategory,
      paymentInfo,
      password,
      sellerType,
      emergencyContact,
      campusConnection
    } = req.body;

    // Enhanced validation with anti-fraud checks
    if (
      !name ||
      !email ||
      !phone ||
      !gender ||
      !storeName ||
      !businessType ||
      !businessAddress ||
      !productCategory ||
      !password
    ) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }
    

    





    // V1: Remove payment requirement for safety-first approach
    // Payment info is optional for V1 launch

    // Sanitize inputs to prevent XSS
    const sanitizedName = DOMPurify.sanitize(name.trim());
    const sanitizedStoreName = DOMPurify.sanitize(storeName.trim());
    const sanitizedBusinessAddress = DOMPurify.sanitize(businessAddress.trim());
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationCode = generateVerificationCode();

    const newSeller = await prisma.seller.create({
      data: {
        name: sanitizedName,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        gender,
        storeName: sanitizedStoreName,
        businessType,
        authId: `DEX${Date.now()}`,
        businessAddress: sanitizedBusinessAddress,
        productCategory,
        paymentInfo: paymentInfo || null,
        password: hashedPassword,
        role: "seller",
        verificationToken,
        verificationCode,
        sellerType: sellerType || "basic",
        verificationTier: sellerType === "business" ? 3 : sellerType === "campus" ? 2 : 1,
        emergencyContact: emergencyContact || null,
        campusConnection: campusConnection || null
      },
    });

    await createNotification({
      sellerId: newSeller.id,
      title: "Welcome to DEX V1! 🎉",
      message: `Welcome ${sanitizedName}! Your ${sellerType} seller account is ready. Complete verification to start selling safely.`,
      type: "system",
    });

    // Respond to client immediately (DB created successfully)
    res.status(201).json({
      message:
        "Seller registered successfully! Please check your email to verify your account.",
      email: newSeller.email,
      role: "seller",
      token: verificationToken,
    });

    // --- Now attempt to send email, but DO NOT let failures break the response ---
    (async () => {
      try {
        const verificationLink = `${
          process.env.FRONTEND_URL
        }/DEX_HOMEPAGES/REGISTRY_PAGES/EMAIL_VERIFICATION/verification_dex.html?token=${verificationToken}&role=seller&email=${encodeURIComponent(
          email
        )}`;

        await transporter.sendMail({
          from: `"Dex Team" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Verify Your Seller Account — Dex",
          html: `
            <div style="font-family:Arial; color:#333;">
              <h2>Welcome Dex Seller!</h2>
              <p>Hi ${DOMPurify.sanitize(sanitizedName)},</p>
              <p>Enter this code to verify your account:</p>
              <h2>${verificationCode}</h2>
              <p>Or click the link to verify directly:</p>
              <a href="${verificationLink}" style="color:#007BFF;">Verify Seller Account</a>
            </div>
          `,
        });

        console.log(`✅ Verification email sent to ${email}`);
      } catch (emailErr) {
        // Log email problems separately — does NOT affect the response already sent
        console.error(
          "❌ EMAIL ERROR (registerSeller):",
          emailErr?.message || emailErr
        );
      }
    })();
  } catch (err) {
    console.error("❌ REGISTER ERROR DETAILS:", err);

    if (err.code === "P2002") {
      const field = err.meta?.target?.[0];
      let message = "Duplicate value detected";
      switch (field) {
        case "email":
          message = "This email is already in use";
          break;
        case "phone":
          message = "This phone number is already in use";
          break;
        case "storeName":
          message = "This store name is already in use";
          break;

      }
      return res.status(400).json({ message });
    }

    return res.status(500).json({
      message: "Server error. Please try again later.",
      details: err.message,
    });
  }
};

/// ================= VERIFY EMAIL =================
export const verifySellerEmail = async (req, res) => {
  try {
    const { token, code } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required." });
    }

    // find seller by token
    const seller = await prisma.seller.findUnique({
      where: { verificationToken: token },
    });

    if (!seller) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    // If a code was provided, validate it (manual verification flow)
    if (
      typeof code !== "undefined" &&
      code !== null &&
      String(code).trim() !== ""
    ) {
      const incoming = String(code).trim().toUpperCase();
      const stored = String(seller.verificationCode || "")
        .trim()
        .toUpperCase();

      // Security: Remove sensitive logging in production
      if (process.env.NODE_ENV === 'development') {
        console.log('Code verification attempt for seller:', seller.id);
      }

      if (!stored || incoming !== stored) {
        return res.status(400).json({ message: "Incorrect verification code" });
      }
    }

    // Otherwise (no code provided) — allow token-only auto verification
    // Mark user verified
    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationCode: null,
      },
    });

    return res.status(200).json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error("verifySellerEmail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/// ================= RESEND VERIFICATION (SELLER) =================
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Find seller by email
    const seller = await prisma.seller.findUnique({ where: { email } });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found." });
    }

    if (seller.isVerified) {
      return res.status(400).json({ message: "Email already verified." });
    }

    // Generate new token + 6-digit code
    const newToken = crypto.randomBytes(32).toString("hex");
    const newCode = generateVerificationCode();

    // Update seller
    await prisma.seller.update({
      where: { id: seller.id },
      data: { verificationToken: newToken, verificationCode: newCode },
    });

    // Create verification link
    const verificationLink = `${
      process.env.FRONTEND_URL
    }/DEX_HOMEPAGES/REGISTRY_PAGES/EMAIL_VERIFICATION/verification_dex.html?token=${newToken}&role=seller&email=${encodeURIComponent(
      email
    )}`;

    // Send email
    await transporter.sendMail({
      from: `"Dex Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Seller Account — Dex",
      html: `
        <div style="font-family:Arial; color:#333;">
          <p>Hi ${DOMPurify.sanitize(seller.name)},</p>
          <p>Use this code to verify your account:</p>
          <h2>${newCode}</h2>
          <p>Or click the link to verify directly:</p>
          <a href="${verificationLink}" style="color:#007BFF;">Verify Email</a>
        </div>
      `,
    });

    res
      .status(200)
      .json({ message: "Verification email resent successfully!" });
  } catch (error) {
    console.error("❌ Resend Verification Error:", error);
    res
      .status(500)
      .json({ message: "Server error. Please try again later. :^(" });
  }
};

// ================= LOGIN =================
export const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;

    const seller = await prisma.seller.findUnique({ where: { email } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    if (!seller.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first" });
    }

    const valid = await bcrypt.compare(password, seller.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: seller.id, role: seller.role, email: seller.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Send back seller details with verification status
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        storeName: seller.storeName,
        profilePic: seller.profilePic,
        role: seller.role,
        productCategory: seller.productCategory,
        // V1 Verification status
        phoneVerified: seller.phoneVerified,
        emergencyContactVerified: seller.emergencyContactVerified,
        campusVerified: seller.campusVerified,
        verificationTier: seller.verificationTier,
        sellerType: seller.sellerType
      },
    });
  } catch (err) {
    console.error("❌ Seller Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Twilio setup (for SMS)
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ==================== SEND RESET CODE ====================
export const sendSellerResetCode = async (req, res) => {
  try {
    const contact = req.body.contact || req.body.email;

    if (!contact || typeof contact !== 'string')
      return res.status(400).json({ message: "📧 Email is required!" });
    if (!contact.includes("@"))
      return res.status(400).json({ message: "⚠️ Invalid email address" });

    const seller = await prisma.seller.findFirst({ where: { email: contact } });
    if (!seller)
      return res.status(404).json({ message: "❌ Seller not found" });

    // Generate a 6-digit numeric code for user
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Convert the 6-digit code into a secure token for DB
    const resetToken = crypto.createHash("sha256").update(code).digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store the token and expiry in DB
    await prisma.seller.update({
      where: { id: seller.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Include the 6-digit code (not token) in the link sent to the user
    const resetLink = `${
      process.env.FRONTEND_URL
    }/DEX_HOMEPAGES/REGISTRY_PAGES/RESET_PASSWORD/reset-password.html?code=${code}&contact=${encodeURIComponent(
      seller.email
    )}&role=seller`;

    // Send email with 6-digit code link
    await transporter.sendMail({
      from: `"Dex Security" <${process.env.EMAIL_USER}>`,
      to: seller.email,
      subject: "🔐 Dex™ Seller Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hi ${DOMPurify.sanitize(seller.name || "there")} 👋</h2>
          <p>We received a request to reset your <strong>Seller</strong> account password.</p>
          <p>Click below to reset it (expires in 30 minutes ⏰):</p>
          <a href="${resetLink}"
             style="background: #f4c542; color: #000; padding: 10px 20px; border-radius: 5px;
                    text-decoration: none; font-weight: bold;">🔁 Reset Password</a>
          <p>If you didn’t request this, you can ignore this email.</p>
          <p>💛 Team Dex</p>
        </div>
      `,
    });

    res
      .status(200)
      .json({ message: "✅ Password reset email sent successfully!" });
  } catch (err) {
    console.error("❌ Send Reset Code Error:", err);
    res
      .status(500)
      .json({ message: "🚨 Server error. Please try again later." });
  }
};

// ==================== VERIFY & RESET PASSWORD ====================
export const verifySellerResetCode = async (req, res) => {
  try {
    const { email, code, newPassword, role } = req.body;

    if (!email || !code || !newPassword || !role)
      return res.status(400).json({
        message: "⚠️ Email, code, role, and new password are required.",
      });

    // Convert received 6-digit code into token to match DB
    const tokenFromCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    let user;

    if (role === "seller") {
      user = await prisma.seller.findFirst({
        where: {
          email,
          resetToken: tokenFromCode,
          resetTokenExpiry: { gt: new Date() },
        },
      });
    } else {
      return res.status(400).json({ message: "❌ Invalid role provided." });
    }

    if (!user)
      return res
        .status(400)
        .json({ message: "❌ Invalid or expired reset code." });

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and remove token/expiry
    await prisma.seller.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res
      .status(200)
      .json({ message: "✅ Password reset successful! You can now log in 🔓" });
  } catch (err) {
    console.error("❌ Reset Password Error:", err);
    res
      .status(500)
      .json({ message: "🚨 Server error. Please try again later." });
  }
};

// ================= GET PROFILE & LOGOUT =================
export const getSellerProfile = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const seller = await prisma.seller.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        storeName: true,
        businessType: true,
        businessAddress: true,
        productCategory: true,
        paymentInfo: true,
        isVerified: true,
        phoneVerified: true,
        emergencyContactVerified: true,
        campusVerified: true,
        verificationTier: true,
        sellerType: true,
      },
    });
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    res.status(200).json(seller);
  } catch (err) {
    console.error("getSellerProfile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const logoutSeller = async (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================= DELETE ACCOUNT =================
export const deleteSellerAccount = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const sellerId = req.user.id;

    // Delete related records first to avoid foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete shop templates first (they reference shop settings)
      await tx.shopTemplate.deleteMany({ where: { sellerId } });
      
      // Delete shop settings
      await tx.shopSettings.deleteMany({ where: { sellerId } });
      
      // Delete verification documents
      await tx.verificationDocument.deleteMany({ where: { sellerId } });
      
      // Delete seller follows and likes
      await tx.sellerFollow.deleteMany({ where: { sellerId } });
      await tx.sellerLike.deleteMany({ where: { sellerId } });
      
      // Delete seller reviews
      await tx.sellerReview.deleteMany({ where: { sellerId } });
      
      // Delete gallery images
      await tx.sellerGalleryImage.deleteMany({ where: { sellerId } });
      
      // Delete notifications
      await tx.notification.deleteMany({ where: { sellerId } });
      
      // Delete orders
      await tx.order.deleteMany({ where: { sellerId } });
      
      // Delete products (this will cascade to related records)
      await tx.product.deleteMany({ where: { sellerId } });
      
      // Finally delete the seller
      await tx.seller.delete({ where: { id: sellerId } });
    });

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete seller account error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
