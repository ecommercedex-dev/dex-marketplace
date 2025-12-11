import express from "express";
import path from "path";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

// ==================== Serve static uploads ====================
// This ensures that all images in /uploads are accessible via the browser
// Example: http://127.0.0.1:5000/uploads/products/xxx.webp
router.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ==================== Wishlist Routes ====================
router.get("/", verifyToken, getWishlist);
router.post("/", verifyToken, addToWishlist);
router.delete("/:productId", verifyToken, removeFromWishlist);

export default router;
