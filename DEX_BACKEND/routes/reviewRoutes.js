import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  addReview,
  getProductReviews,
  getBuyerReviews,
} from "../controllers/reviewController.js";

const router = express.Router();

// Add a new review
router.post("/", verifyToken, addReview);

// Get reviews for a specific product
router.get("/product/:productId", getProductReviews);

// Get all reviews written by logged-in buyer
router.get("/mine", verifyToken, getBuyerReviews);

export default router;
