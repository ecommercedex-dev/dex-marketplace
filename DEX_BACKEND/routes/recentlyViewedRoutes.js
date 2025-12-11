import express from "express";
import {
  addRecentlyViewed,
  getRecentlyViewed,
  removeRecentlyViewed,
} from "../controllers/recentlyViewedController.js";

const router = express.Router();

// Add/update a recently viewed product
router.post("/", addRecentlyViewed);

// Get a buyer's recently viewed list
router.get("/:buyerId", getRecentlyViewed);

// Remove a recently viewed item (optional)
router.delete("/", removeRecentlyViewed);

export default router;
