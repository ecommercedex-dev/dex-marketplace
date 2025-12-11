import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/shop_customization";
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const sanitizedName = path.basename(file.originalname);
    cb(
      null,
      `${Date.now()}-${file.fieldname}${path.extname(sanitizedName)}`
    );
  },
});

export const uploadShopImages = multer({ 
  storage,
  limits: { fieldSize: 10 * 1024 * 1024 }
}).fields([
  { name: "bannerImage", maxCount: 1 },
  { name: "shopLogo", maxCount: 1 },
]);

export const getShopSettings = async (req, res) => {
  try {
    const sellerId = req.user.id;
    let settings = await prisma.shopSettings.findUnique({
      where: { sellerId },
    });

    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: { sellerId },
      });
    }

    res.json(settings);
  } catch (err) {
    console.error("Get shop settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPublicShopSettings = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const settings = await prisma.shopSettings.findUnique({
      where: { sellerId: parseInt(sellerId) },
    });

    res.json(settings || {});
  } catch (err) {
    console.error("Get public shop settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateShopSettings = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const {
      tagline,
      aboutShop,
      primaryColor,
      accentColor,
      socialLinks,
      businessHours,
      returnPolicy,
      paymentMethods,
      bannerConfig,
      clearBannerImage,
      logoType,
      logoText,
      logoIcon,
      logoTextColor,
      logoIconColor,
      logoBackgroundColor,
      logoFont,
      logoLayout,
      clearShopLogo,
    } = req.body;

    const data = {};
    if (tagline !== undefined) data.tagline = tagline;
    if (aboutShop !== undefined) data.aboutShop = aboutShop;
    if (primaryColor) data.primaryColor = primaryColor;
    if (accentColor) data.accentColor = accentColor;
    if (socialLinks) {
      try {
        const parsed = JSON.parse(socialLinks);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && 
            parsed.constructor === Object) {
          data.socialLinks = parsed;
        }
      } catch (err) {
        // Invalid JSON, skip
      }
    }
    if (businessHours !== undefined) data.businessHours = businessHours;
    if (returnPolicy !== undefined) data.returnPolicy = returnPolicy;
    if (paymentMethods !== undefined) data.paymentMethods = paymentMethods;

    // Handle banner configuration
    if (bannerConfig) {
      try {
        const parsed = JSON.parse(bannerConfig);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && 
            parsed.constructor === Object) {
          data.bannerConfig = parsed;
        }
      } catch (err) {
        // Invalid JSON, skip
      }
    }
    if (clearBannerImage === 'true') {
      data.bannerImage = null; // Clear uploaded banner when using builder
    }

    // Handle logo configuration
    if (logoType) {
      data.logoType = logoType;
      data.logoText = logoText || null;
      data.logoIcon = logoIcon || null;
      data.logoTextColor = logoTextColor || null;
      data.logoIconColor = logoIconColor || null;
      data.logoBackgroundColor = logoBackgroundColor || null;
      data.logoFont = logoFont || null;
      data.logoLayout = logoLayout || null;
    }
    if (clearShopLogo === 'true') {
      data.shopLogo = null; // Clear uploaded logo when using builder
    }

    // Handle file uploads
    if (req.files?.shopLogo) {
      data.shopLogo = `/uploads/shop_customization/${req.files.shopLogo[0].filename}`;
      // Clear builder settings when uploading file
      data.logoType = 'upload';
      data.logoText = null;
      data.logoIcon = null;
      data.logoTextColor = null;
      data.logoIconColor = null;
      data.logoBackgroundColor = null;
      data.logoFont = null;
      data.logoLayout = null;
    }

    const settings = await prisma.shopSettings.upsert({
      where: { sellerId },
      update: data,
      create: { sellerId, ...data },
    });

    res.json(settings);
  } catch (err) {
    console.error("Update shop settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
