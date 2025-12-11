import express from "express";
import { verifyToken, restrictTo } from "../middleware/authMiddleware.js";
import {
  reviewSeller,
  getSellerReviews,
} from "../controllers/sellerReviewController.js";

const router = express.Router();

// POST: Submit seller review
router.post(
  "/sellers/:sellerId/reviews",
  verifyToken,
  restrictTo("buyer"),
  reviewSeller
);

// GET: Fetch all reviews for a seller
router.get("/sellers/:sellerId/reviews", getSellerReviews);
router.get("/seller-reviews/:sellerId", getSellerReviews);
export default router;
