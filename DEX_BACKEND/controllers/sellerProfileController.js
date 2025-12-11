import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

// ============ STORAGE SETUP =============

// Profile picture storage
const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/seller_profile_pictures";
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

// Gallery images storage
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/seller_gallery";
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

export const uploadProfilePic = multer({ storage: profilePicStorage }).single(
  "profilePic"
);
export const uploadGallery = multer({ storage: galleryStorage }).array(
  "images",
  10
);

// ============ CONTROLLERS =============

// Get Seller Profile
export const getSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        storeName: true,
        businessType: true,
        businessAddress: true,
        productCategory: true,
        paymentInfo: true,
        profilePic: true,
        role: true,
      },
    });

    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Return SVG default if no profile pic
    if (!seller.profilePic) {
      seller.profilePic = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
    }

    res.status(200).json(seller);
  } catch (err) {
    console.error("Get Seller Profile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Seller Profile (Text Fields)
export const updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { name, phone, businessAddress, storeName, email } = req.body;

    // ============================
    // 1️⃣ CHECK IF storeName EXISTS
    // ============================
    if (storeName) {
      const existing = await prisma.seller.findFirst({
        where: {
          storeName,
          NOT: { id: sellerId }, // exclude current seller
        },
      });

      if (existing) {
        return res.status(400).json({
          message: "Store name already taken. Choose another one.",
        });
      }
    }

    // ============================
    // 2️⃣ UPDATE SELLER
    // ============================
    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: { name, phone, businessAddress, storeName, email },
      select: {
        id: true,
        name: true,
        phone: true,
        businessAddress: true,
        storeName: true,
        email: true,
        profilePic: true,
        productCategory: true,
        businessType: true,
      },
    });

    // ============================
    // 3️⃣ SEND STRUCTURED RESPONSE
    // ============================
    // Return SVG default if no profile pic
    if (!updatedSeller.profilePic) {
      updatedSeller.profilePic = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
    }
    return res.status(200).json(updatedSeller);
  } catch (err) {
    console.error("Update Seller Profile Error:", err);
    return res.status(500).json({ message: "Error updating profile" });
  }
};

// Upload Seller Profile Picture
export const uploadSellerProfilePicture = async (req, res) => {
  try {
    const sellerId = req.user.id;

    if (!req.file)
      return res.status(400).json({ message: "No image uploaded" });

    const filePath = `/uploads/seller_profile_pictures/${req.file.filename}`;

    // 1. Update profilePic
    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: { profilePic: filePath },
    });

    // 2. ALSO add to gallery (so it shows up)
    await prisma.sellerGalleryImage.upsert({
      where: {
        sellerId_url: { sellerId, url: filePath },
      },
      update: {},
      create: { sellerId, url: filePath },
    });

    res.status(200).json({
      message: "Profile picture updated",
      profilePic: updatedSeller.profilePic,
    });
  } catch (err) {
    console.error("Upload Seller Picture Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload Multiple Gallery Images
export const uploadSellerGalleryImages = async (req, res) => {
  try {
    const sellerId = req.user.id;

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "No images uploaded" });

    const urls = [];

    for (const file of req.files) {
      const filePath = `/uploads/seller_gallery/${file.filename}`;
      const img = await prisma.sellerGalleryImage.create({
        data: { url: filePath, sellerId },
      });
      urls.push(img.url);
    }

    const galleryImages = await prisma.sellerGalleryImage.findMany({
      where: { sellerId },
    });

    res.status(200).json({ message: "Images uploaded", galleryImages });
  } catch (err) {
    console.error("Upload Gallery Images Error:", err);
    res.status(500).json({ message: "Server error uploading images" });
  }
};

// Fetch Seller Gallery Images
export const getSellerGalleryImages = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const galleryImages = await prisma.sellerGalleryImage.findMany({
      where: { sellerId },
      orderBy: { createdAt: "asc" }, // Preserve drag order
    });

    res.status(200).json(galleryImages);
  } catch (err) {
    console.error("Fetch Gallery Images Error:", err);
    res.status(500).json({ message: "Server error fetching images" });
  }
};

// DELETE: Remove image from gallery + disk
export const deleteGalleryImage = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { filename } = req.params;

    const possibleUrls = [
      `/uploads/seller_gallery/${filename}`,
      `/uploads/seller_profile_pictures/${filename}`,
    ];

    const image = await prisma.sellerGalleryImage.findFirst({
      where: {
        sellerId,
        url: { in: possibleUrls },
      },
    });

    if (!image) {
      return res.status(404).json({ message: "Image not found in gallery" });
    }

    await prisma.sellerGalleryImage.delete({ where: { id: image.id } });

    // Properly sanitize the file path to prevent directory traversal
    const sanitizedUrl = path.basename(image.url);
    const filePath = path.resolve(__dirname, "..", "uploads", "seller_gallery", sanitizedUrl);
    
    // Ensure the resolved path is within the expected directory
    const uploadsDir = path.resolve(__dirname, "..", "uploads", "seller_gallery");
    if (filePath.startsWith(uploadsDir) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({ message: "Image deleted" });
  } catch (err) {
    console.error("Delete gallery image error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST: Reorder gallery
export const reorderGalleryImages = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { order } = req.body;

    if (!Array.isArray(order) || order.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid order: must be non-empty array" });
    }

    // Normalize URLs (just in case)
    const normalizedOrder = order.map((url) =>
      url.startsWith("/") ? url : `/${url}`
    );

    // Validate all URLs belong to this seller
    const existing = await prisma.sellerGalleryImage.findMany({
      where: { sellerId, url: { in: order } },
      select: { url: true },
    });

    const existingUrls = existing.map((i) => i.url);
    const invalid = order.filter((url) => !existingUrls.includes(url));
    if (invalid.length > 0) {
      return res.status(400).json({ message: "Unauthorized images" });
    }

    // Delete old order
    await prisma.sellerGalleryImage.deleteMany({ where: { sellerId } });

    // Insert in new order with timestamp
    const now = Date.now();
    await prisma.$transaction(
      order.map((url, index) =>
        prisma.sellerGalleryImage.create({
          data: {
            url,
            sellerId,
            createdAt: new Date(now + index), // Preserve order
          },
        })
      )
    );

    res.status(200).json({ message: "Gallery reordered" });
  } catch (err) {
    console.error("Reorder gallery error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
