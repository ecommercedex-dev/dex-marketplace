import express from "express";
import { getStats, getTestimonials, getFeaturedSellers, getTrendingProducts, subscribeNewsletter } from "../controllers/homeController.js";

const router = express.Router();

router.get("/stats", getStats);
router.get("/testimonials", getTestimonials);
router.get("/featured-sellers", getFeaturedSellers);
router.get("/trending-products", getTrendingProducts);
router.post("/newsletter", subscribeNewsletter);

export default router;
