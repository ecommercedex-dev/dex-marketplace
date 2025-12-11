import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// V1 Verification file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/v1_verifications";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const sanitizedName = path.basename(file.originalname);
    const ext = path.extname(sanitizedName);
    cb(null, `seller_${req.user.id}_${Date.now()}${ext}`);
  },
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|pdf)$/i;
    cb(null, allowed.test(file.originalname));
  }
});

// Submit campus verification (Tier 2)
export const submitCampusVerification = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { verificationType, notes } = req.body;
    
    // Handle multiple files
    const files = req.files || {};
    const filePaths = {
      primary: files.primaryDocument ? files.primaryDocument[0].filename : null,
      secondary: files.secondaryDocument ? files.secondaryDocument[0].filename : null,
      selfie: files.selfieDocument ? files.selfieDocument[0].filename : null
    };

    // Update seller with campus verification pending status and file paths
    await prisma.seller.update({
      where: { id: sellerId },
      data: {
        campusConnection: verificationType,
        campusVerified: false, // Pending review
        verificationTier: 2, // Upgrade to tier 2 pending
        // File paths will be stored when database schema is updated
      }
    });

    // Store verification documents in database
    await prisma.verificationDocument.create({
      data: {
        sellerId,
        verificationType,
        primaryDocPath: filePaths.primary ? `/uploads/v1_verifications/${filePaths.primary}` : null,
        secondaryDocPath: filePaths.secondary ? `/uploads/v1_verifications/${filePaths.secondary}` : null,
        selfieDocPath: filePaths.selfie ? `/uploads/v1_verifications/${filePaths.selfie}` : null,
        notes: notes || null,
        status: 'pending'
      }
    });

    console.log(`Campus verification submitted by seller ${sellerId}:`, {
      type: verificationType,
      files: filePaths,
      notes: notes || 'No additional notes'
    });

    res.json({ 
      message: "Campus verification submitted successfully! We'll review within 24-48 hours and notify you via email.",
      status: "pending_review"
    });
  } catch (error) {
    console.error("Campus verification error:", error);
    res.status(500).json({ message: "Verification submission failed. Please try again." });
  }
};

// Get seller verification status
export const getVerificationStatus = async (req, res) => {
  try {
    const seller = await prisma.seller.findUnique({
      where: { id: req.user.id },
      select: {
        sellerType: true,
        verificationTier: true,
        isVerified: true,
        phoneVerified: true,
        campusVerified: true,
        businessVerified: true,
        campusConnection: true
      }
    });

    const badges = [];
    if (seller.isVerified) badges.push("✅ Email Verified");
    if (seller.phoneVerified) badges.push("📱 Phone Verified");
    if (seller.campusVerified) badges.push("🎓 Campus Verified");
    if (seller.businessVerified) badges.push("🏢 Business Verified");

    res.json({
      ...seller,
      badges,
      nextStep: getNextVerificationStep(seller)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get verification status" });
  }
};

function getNextVerificationStep(seller) {
  if (!seller.isVerified) return "Verify your email address";
  if (!seller.phoneVerified) return "Verify your phone number";
  if (seller.sellerType === "campus" && !seller.campusVerified) return "Submit campus verification";
  if (seller.sellerType === "business" && !seller.businessVerified) return "Submit business documents";
  return "All verifications complete! 🎉";
}