// Enhanced Seller Verification System
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import twilio from "twilio";
import rateLimit from "express-rate-limit";

const prisma = new PrismaClient();

// Security utilities
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Enhanced validation function
const validateSellerInput = (data) => {
  const errors = [];
  
  // Name validation (no special characters that could be XSS)
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Valid name is required (minimum 2 characters)');
  }
  if (data.name && /<[^>]*>/.test(data.name)) {
    errors.push('Name cannot contain HTML tags');
  }
  
  // Email validation with institutional domain check
  if (!data.email || typeof data.email !== 'string' || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  // Check for institutional email domains (enhance as needed)
  const allowedDomains = ['.edu', 'university.edu', 'student.university.edu'];
  const emailDomain = data.email.toLowerCase();
  const isInstitutional = allowedDomains.some(domain => emailDomain.includes(domain));
  
  if (!isInstitutional) {
    errors.push('Please use your institutional email address');
  }
  
  // Phone validation
  if (!data.phone || typeof data.phone !== 'string' || !isValidPhone(data.phone)) {
    errors.push('Valid phone number is required');
  }
  
  // Business validation
  if (!data.storeName || typeof data.storeName !== 'string' || data.storeName.trim().length < 3) {
    errors.push('Store name must be at least 3 characters');
  }
  
  // Business address validation
  if (!data.businessAddress || typeof data.businessAddress !== 'string' || data.businessAddress.trim().length < 10) {
    errors.push('Complete business address is required');
  }
  
  // Payment info validation (should be encrypted)
  if (!data.paymentInfo || typeof data.paymentInfo !== 'string') {
    errors.push('Payment information is required');
  }
  
  return errors;
};

// Rate limiting for registration
export const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 registration attempts per windowMs
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Phone verification system
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendPhoneVerification = async (phone) => {
  try {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await twilioClient.messages.create({
      body: `Your Dex verification code is: ${verificationCode}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE,
      to: phone
    });
    
    return { success: true, code: verificationCode };
  } catch (error) {
    console.error('SMS sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Enhanced seller registration with multi-step verification
export const registerSellerEnhanced = async (req, res) => {
  try {
    const sellerData = req.body;
    
    // Step 1: Input validation
    const validationErrors = validateSellerInput(sellerData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    // Step 2: Check for existing accounts
    const existingUser = await prisma.seller.findFirst({
      where: {
        OR: [
          { email: sellerData.email },
          { phone: sellerData.phone },
          { storeName: sellerData.storeName }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Account already exists with this email, phone, or store name' 
      });
    }
    
    // Step 3: Generate verification tokens
    const hashedPassword = await bcrypt.hash(sellerData.password, 12);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationCode = generateVerificationCode();
    
    // Step 4: Send phone verification
    const phoneVerification = await sendPhoneVerification(sellerData.phone);
    if (!phoneVerification.success) {
      return res.status(500).json({ 
        message: 'Failed to send phone verification. Please check your phone number.' 
      });
    }
    
    // Step 5: Create seller account (initially unverified)
    const newSeller = await prisma.seller.create({
      data: {
        name: sellerData.name.trim(),
        email: sellerData.email.toLowerCase(),
        phone: sellerData.phone,
        gender: sellerData.gender,
        storeName: sellerData.storeName.trim(),
        businessType: sellerData.businessType,
        authId: `DEX${Date.now()}`,
        businessAddress: sellerData.businessAddress,
        productCategory: sellerData.productCategory,
        paymentInfo: sellerData.paymentInfo, // Should be encrypted in production
        password: hashedPassword,
        role: "seller",
        verificationToken: emailVerificationToken,
        verificationCode: emailVerificationCode,
        phoneVerificationCode: phoneVerification.code,
        phoneVerificationExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        // New safety flags
        safetyConfirmed: false,
        antiScamConfirmed: false,
        studentConfirmed: false,
        reputationScore: 0,
        verificationLevel: 'basic'
      },
    });
    
    // Step 6: Send email verification (with XSS protection)
    const safeName = escapeHtml(newSeller.name);
    await sendVerificationEmail(newSeller.email, safeName, emailVerificationCode, emailVerificationToken);
    
    // Step 7: Create notification
    await createNotification({
      sellerId: newSeller.id,
      title: "Welcome to Dex!",
      message: "Complete your verification to start selling safely.",
      type: "verification_required",
    });
    
    res.status(201).json({
      message: "Registration initiated! Please verify your email and phone number.",
      sellerId: newSeller.id,
      verificationRequired: {
        email: true,
        phone: true,
        studentId: true
      }
    });
    
  } catch (error) {
    console.error('Enhanced registration error:', error);
    res.status(500).json({ 
      message: "Registration failed. Please try again later." 
    });
  }
};

// Phone verification endpoint
export const verifyPhone = async (req, res) => {
  try {
    const { sellerId, code } = req.body;
    
    const seller = await prisma.seller.findUnique({
      where: { id: parseInt(sellerId) }
    });
    
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
    if (seller.phoneVerificationExpiry < new Date()) {
      return res.status(400).json({ message: "Verification code expired" });
    }
    
    if (seller.phoneVerificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }
    
    // Update seller as phone verified
    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        phoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationExpiry: null
      }
    });
    
    res.json({ message: "Phone verified successfully!" });
    
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// Reputation scoring system
export const calculateReputationScore = async (sellerId) => {
  try {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        reviews: true,
        orders: true,
        products: true
      }
    });
    
    if (!seller) return 0;
    
    let score = 0;
    
    // Base verification points
    if (seller.isVerified) score += 20;
    if (seller.phoneVerified) score += 15;
    if (seller.studentConfirmed) score += 25;
    if (seller.safetyConfirmed) score += 10;
    if (seller.antiScamConfirmed) score += 10;
    
    // Review-based scoring
    if (seller.reviews.length > 0) {
      const avgRating = seller.reviews.reduce((sum, review) => sum + review.rating, 0) / seller.reviews.length;
      score += Math.round(avgRating * 4); // Max 20 points for 5-star average
    }
    
    // Transaction history
    const completedOrders = seller.orders.filter(order => order.status === 'completed').length;
    score += Math.min(completedOrders * 2, 30); // Max 30 points for transactions
    
    // Product quality (active products)
    const activeProducts = seller.products.filter(product => product.deployed).length;
    score += Math.min(activeProducts, 10); // Max 10 points for active products
    
    // Update seller's reputation score
    await prisma.seller.update({
      where: { id: sellerId },
      data: { reputationScore: Math.min(score, 100) } // Cap at 100
    });
    
    return Math.min(score, 100);
    
  } catch (error) {
    console.error('Reputation calculation error:', error);
    return 0;
  }
};

// Trust level determination
export const getTrustLevel = (reputationScore, verificationFlags) => {
  const { isVerified, phoneVerified, studentConfirmed, safetyConfirmed } = verificationFlags;
  
  if (reputationScore >= 80 && isVerified && phoneVerified && studentConfirmed && safetyConfirmed) {
    return 'trusted';
  } else if (reputationScore >= 60 && isVerified && phoneVerified && studentConfirmed) {
    return 'verified';
  } else if (reputationScore >= 40 && isVerified && phoneVerified) {
    return 'basic';
  } else {
    return 'probation';
  }
};

// Fraud detection system
export const detectSuspiciousActivity = async (sellerId) => {
  try {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        products: true,
        orders: true
      }
    });
    
    const suspiciousFlags = [];
    
    // Check for unusual pricing patterns
    if (seller.products.length > 0) {
      const prices = seller.products.map(p => p.price);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const extremePrices = prices.filter(price => price > avgPrice * 5 || price < avgPrice * 0.2);
      
      if (extremePrices.length > prices.length * 0.3) {
        suspiciousFlags.push('unusual_pricing');
      }
    }
    
    // Check for rapid order cancellations
    const recentCancellations = seller.orders.filter(order => 
      order.status === 'cancelled' && 
      order.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    if (recentCancellations > 5) {
      suspiciousFlags.push('high_cancellation_rate');
    }
    
    // Check for duplicate business information
    const duplicateBusinessInfo = await prisma.seller.count({
      where: {
        AND: [
          { id: { not: sellerId } },
          {
            OR: [
              { businessAddress: seller.businessAddress },
              { paymentInfo: seller.paymentInfo }
            ]
          }
        ]
      }
    });
    
    if (duplicateBusinessInfo > 0) {
      suspiciousFlags.push('duplicate_business_info');
    }
    
    return suspiciousFlags;
    
  } catch (error) {
    console.error('Fraud detection error:', error);
    return [];
  }
};

export default {
  registerSellerEnhanced,
  verifyPhone,
  calculateReputationScore,
  getTrustLevel,
  detectSuspiciousActivity,
  registrationLimiter
};