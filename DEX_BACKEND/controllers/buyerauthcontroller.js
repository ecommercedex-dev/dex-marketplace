import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

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

// ================= REGISTER =================
export const registerUser = async (req, res) => {
  try {
    const { name, index_num, email, password, gender, role, number, address, safetyAgreement, adminSecret } =
      req.body;

    if (!name || !email || !password || !gender || !number) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!safetyAgreement) {
      return res.status(400).json({ message: "Safety agreement must be accepted" });
    }

    // Secret admin registration
    if (process.env.ADMIN_CREATOR_SECRET && adminSecret === process.env.ADMIN_CREATOR_SECRET) {
      const adminUser = await prisma.admin.create({
        data: {
          name,
          email,
          password: await bcrypt.hash(password, 12),
        }
      });
      
      return res.status(201).json({
        message: "🔑 Admin account created successfully!",
        adminAccess: {
          url: "secret-dex-admin-2024/login.html",
          credentials: { email, password: "[hidden]" },
          secretKey: process.env.ADMIN_SECRET_KEY
        }
      });
    }

    // Enhanced password validation
    if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters with uppercase, lowercase, and number" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = generateVerificationCode();
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await prisma.buyer.create({
      data: {
        name,
        index_num,
        email,
        password: hashedPassword,
        gender,
        role: role || "buyer",
        number,
        address,
        verificationToken,
        verificationCode,
      },
    });

    const verificationLink = `${
      process.env.FRONTEND_URL
    }/DEX_HOMEPAGES/REGISTRY_PAGES/EMAIL_VERIFICATION/verification_dex.html?token=${verificationToken}&role=buyer&email=${encodeURIComponent(
      email
    )}`;

    await transporter.sendMail({
      from: `"Dex Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🛡️ Welcome to Dex - Verify Your Safe Campus Account",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>🛡️ Welcome to Dex, ${name}!</h2>
          <p>Thank you for joining our safe campus marketplace community.</p>
          <p>Use this code to verify your account:</p>
          <h2 style="background: #f4c542; padding: 10px; border-radius: 5px; display: inline-block;">${verificationCode}</h2>
          <p><strong>Safety Reminder:</strong> Always meet in public campus locations and trust your instincts.</p>
          <p>💛 Team Dex - Building Trust, One Transaction at a Time</p>
        </div>
      `,
    });

    // Create default safety settings
    await prisma.buyerSettings.create({
      data: {
        buyerId: user.id,
        profileVisibility: "campus",
        contactPrefs: "verified",
        showRealName: false,
        showTrustScore: true
      }
    });

    res.status(201).json({
      message: "🛡️ Account created! Please verify your email to start trading safely.",
      email: user.email,
      role: "buyer",
      token: verificationToken,
    });
  } catch (error) {
    console.error("❌ Register Error:", error);

    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      let message = "Duplicate value detected";
      switch (field) {
        case "email":
          message = "This email is already in use";
          break;
        case "number":
          message = "This phone number is already in use";
          break;
        case "index_num":
          message = "This index number is already in use";
          break;
      }
      return res.status(400).json({ message });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// ================= VERIFY EMAIL =================
export const verifyEmail = async (req, res) => {
  try {
    const { token, code } = req.body;
    if (!token || !code)
      return res.status(400).json({ message: "Token and code are required" });

    const user = await prisma.buyer.findUnique({
      where: { verificationToken: token },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Incorrect verification code" });
    }

    await prisma.buyer.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationCode: null,
      },
    });

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("❌ Verify Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= RESEND VERIFICATION =================
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const buyer = await prisma.buyer.findUnique({ where: { email } });
    if (!buyer) return res.status(404).json({ message: "Buyer not found." });
    if (buyer.isVerified)
      return res.status(400).json({ message: "Email already verified." });

    const newCode = generateVerificationCode();
    const newToken = crypto.randomBytes(32).toString("hex");

    await prisma.buyer.update({
      where: { id: buyer.id },
      data: { verificationToken: newToken, verificationCode: newCode },
    });

    const verificationLink = `${
      process.env.FRONTEND_URL
    }/DEX_HOMEPAGES/REGISTRY_PAGES/EMAIL_VERIFICATION/verification_dex.html?token=${newToken}&role=buyer&email=${encodeURIComponent(
      email
    )}`;

    await transporter.sendMail({
      from: `"Dex Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Buyer Account — Dex",
      html: `
        <div style="font-family:Arial; color:#333;">
          <p>Hi ${buyer.name},</p>
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
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

//=============== LOGIN ================//
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.buyer.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "😢 Buyer not found!" });

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Include safety verification status
    res.status(200).json({
      message: "🛡️ Welcome back to Dex - Stay Safe!",
      token,
      user: {
        id: user.id,
        name: user.name,
        index_num: user.index_num,
        email: user.email,
        gender: user.gender,
        number: user.number,
        address: user.address,
        profilePic: user.profilePic,
        role: user.role,
        phoneVerified: user.phoneVerified,
        studentVerified: user.studentVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGOUT =================
export const logoutUser = async (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== SEND RESET CODE ====================
export const sendBuyerResetCode = async (req, res) => {
  try {
    const email = req.body.email;

    if (!email)
      return res.status(400).json({ message: "📧 Email is required!" });

    const buyer = await prisma.buyer.findUnique({ where: { email } });
    if (!buyer)
      return res
        .status(404)
        .json({ message: "❌ No buyer found with that email address." });

    // Generate a 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash code into a secure token for database storage
    const resetToken = crypto.createHash("sha256").update(code).digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.buyer.update({
      where: { id: buyer.id },
      data: { verificationToken: resetToken, resetTokenExpiry },
    });

    // Send link with 6-digit code (not hashed token)
    const resetLink = `${
      process.env.FRONTEND_URL
    }/DEX_HOMEPAGES/REGISTRY_PAGES/RESET_PASSWORD/reset-password.html?code=${code}&role=buyer&contact=${encodeURIComponent(
      email
    )}`;

    await transporter.sendMail({
      from: `"Dex Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Dex™ Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hi ${buyer.name || "there"} 👋</h2>
          <p>We received a request to reset your <strong>Buyer</strong> account password.</p>
          <p>Click below to reset it (expires in 30 minutes ⏰):</p>
          <a href="${resetLink}"
             style="background: #f4c542; color: #000; padding: 10px 20px; border-radius: 5px;
                    text-decoration: none; font-weight: bold;">🔁 Reset Password</a>
          <p>If you didn’t request this, you can safely ignore this email.</p>
          <p>💛 Team Dex</p>
        </div>
      `,
    });

    res
      .status(200)
      .json({ message: "✅ Password reset email sent successfully!" });
  } catch (error) {
    console.error("❗Send Reset Code Error:", error);
    res
      .status(500)
      .json({ message: "🚨 Server error. Please try again later." });
  }
};

// ==================== VERIFY & RESET PASSWORD ====================
export const verifyBuyerResetCode = async (req, res) => {
  try {
    const { code, newPassword, role, contact } = req.body;

    if (!code || !newPassword || !role || !contact)
      return res.status(400).json({
        message: "⚠️ Code, role, email, and new password are required.",
      });

    // Convert 6-digit code to token
    const tokenFromCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    let user;

    if (role === "buyer") {
      user = await prisma.buyer.findFirst({
        where: {
          email: contact,
          verificationToken: tokenFromCode,
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

    await prisma.buyer.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        verificationToken: null,
        resetTokenExpiry: null,
      },
    });

    res
      .status(200)
      .json({ message: "✅ Password reset successful! You can now log in 🔓" });
  } catch (error) {
    console.error("❗Reset Password Error:", error);
    res
      .status(500)
      .json({ message: "🚨 Server error. Please try again later." });
  }
};


