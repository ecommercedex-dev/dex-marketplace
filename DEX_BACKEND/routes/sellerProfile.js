import express from "express";
import {
  getSellerProfile,
  updateSellerProfile,
  uploadSellerProfilePicture,
  uploadSellerGalleryImages,
  getSellerGalleryImages,
  uploadProfilePic,
  uploadGallery,
  deleteGalleryImage,
  reorderGalleryImages,
} from "../controllers/sellerProfileController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET: Fetch seller profile
router.get("/", verifyToken, getSellerProfile);

// PUT: Update text fields (name, email, etc.)
router.put("/update", verifyToken, updateSellerProfile);

// POST: Upload profile picture
router.post(
  "/uploadProfilePic",
  verifyToken,
  uploadProfilePic, // Multer middleware
  uploadSellerProfilePicture // Controller
);

// POST: Upload multiple gallery images
router.post(
  "/uploadGallery",
  verifyToken,
  uploadGallery, // Multer array (max 10)
  uploadSellerGalleryImages // Controller
);

// GET: Fetch all gallery images (ordered by createdAt)
router.get("/gallery", verifyToken, getSellerGalleryImages);

// DELETE: Remove image from gallery + disk
router.delete("/gallery/:filename", verifyToken, deleteGalleryImage);

// POST: Save new gallery order after drag-to-reorder
router.post("/gallery/reorder", verifyToken, reorderGalleryImages);

export default router;
