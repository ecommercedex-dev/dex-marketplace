import express from "express";
import {
  getBuyerProfile,
  updateBuyerProfile,
  uploadProfilePicture,
  upload,
} from "../controllers/buyerProfileController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getBuyerProfile);
router.put("/", verifyToken, updateBuyerProfile);
router.post(
  "/picture",
  verifyToken,
  upload.single("profilePic"),
  uploadProfilePicture
);

export default router;
