import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// Storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/student_ids";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const sanitizedName = path.basename(file.originalname);
    const ext = path.extname(sanitizedName);
    cb(null, `student_${req.user.id}_${Date.now()}${ext}`);
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

// Submit student ID for verification
export const submitStudentID = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const filePath = `/uploads/student_ids/${req.file.filename}`;

    await prisma.studentVerification.create({
      data: {
        buyerId,
        documentPath: filePath,
        status: "pending",
        submittedAt: new Date()
      }
    });

    res.json({ message: "Student ID submitted for review" });
  } catch (error) {
    console.error("Submit student ID error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};

// Admin: Get pending verifications
export const getPendingVerifications = async (req, res) => {
  try {
    const pending = await prisma.studentVerification.findMany({
      where: { status: "pending" },
      include: {
        buyer: {
          select: { id: true, name: true, email: true, index_num: true }
        }
      },
      orderBy: { submittedAt: "desc" }
    });

    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch" });
  }
};

// Admin: Approve/reject verification
export const reviewVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // "approved" or "rejected"

    const updateData = { 
      status, 
      reviewedAt: new Date()
    };
    
    if (notes) updateData.reviewNotes = notes;
    if (req.user?.id) updateData.reviewedBy = req.user.id;

    const verification = await prisma.studentVerification.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { buyer: true }
    });

    // Update buyer's verification status
    if (status === "approved") {
      await prisma.buyer.update({
        where: { id: verification.buyerId },
        data: { studentVerified: true }
      });
    }

    res.json({ message: `Verification ${status}` });
  } catch (error) {
    console.error('Review verification error:', error);
    res.status(500).json({ message: "Review failed", error: error.message });
  }
};