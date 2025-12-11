import express from "express";
import { verifyToken, restrictTo } from "../middleware/authMiddleware.js";
import {
  getShopSettings,
  getPublicShopSettings,
  updateShopSettings,
  uploadShopImages,
} from "../controllers/shopSettingsController.js";
import {
  saveTemplate,
  getTemplates,
  getTemplate,
  applyTemplate,
  deleteTemplate,
} from "../controllers/shopTemplatesController.js";

const router = express.Router();

router.get("/settings", verifyToken, restrictTo("seller"), getShopSettings);
router.get("/settings/public/:sellerId", getPublicShopSettings);
router.put(
  "/settings",
  verifyToken,
  restrictTo("seller"),
  uploadShopImages,
  updateShopSettings
);

// Template routes
router.post("/templates", verifyToken, restrictTo("seller"), saveTemplate);
router.get("/templates", verifyToken, restrictTo("seller"), getTemplates);
router.get("/templates/:templateId", verifyToken, restrictTo("seller"), getTemplate);
router.post("/templates/:templateId/apply", verifyToken, restrictTo("seller"), applyTemplate);
router.delete("/templates/:templateId", verifyToken, restrictTo("seller"), deleteTemplate);

export default router;
