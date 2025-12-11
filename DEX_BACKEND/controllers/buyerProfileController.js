import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// ============ STORAGE SETUP =============
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve("uploads/profile_pictures");
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const sanitizedName = path.basename(file.originalname);
    const ext = path.extname(sanitizedName);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

export const upload = multer({ storage });

// ============ CONTROLLERS =============

// Get profile
export const getBuyerProfile = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      select: {
        id: true,
        name: true,
        email: true,
        number: true,
        address: true,
        profilePic: true,
        role: true,
        index_num: true,
        isVerified: true,
        phoneVerified: true,
        studentVerified: true,
      },
    });

    if (!buyer) return res.status(404).json({ message: "Buyer not found" });
    res.status(200).json(buyer);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// Update profile
export const updateBuyerProfile = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { name, email, number, address } = req.body;

    const updatedBuyer = await prisma.buyer.update({
      where: { id: buyerId },
      data: {
        name, // ✅ your DB actually uses this field
        email,
        number,
        address,
      },
    });

    res.json({
      message: "✅ Profile updated successfully",
      name: updatedBuyer.name,
      email: updatedBuyer.email,
      number: updatedBuyer.number,
      address: updatedBuyer.address,
      profilePic: updatedBuyer.profilePic,
    });
  } catch (err) {
    console.error("❌ Profile update failed:", err);
    res.status(500).json({ message: "Server error during profile update" });
  }
};

// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const filePath = `/uploads/profile_pictures/${req.file.filename}`;

    const updatedBuyer = await prisma.buyer.update({
      where: { id: buyerId },
      data: { profilePic: filePath },
      select: {
        id: true,
        name: true,
        email: true,
        number: true,
        address: true,
        profilePic: true,
        role: true,
        index_num: true,
      },
    });

    res.status(200).json(updatedBuyer);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
