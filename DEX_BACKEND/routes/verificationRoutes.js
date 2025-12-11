import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyPhoneCode } from "../controllers/phoneVerificationController.js";
import { confirmEmergencyContact } from "../controllers/emergencyContactController.js";
import { sendPhoneVerificationEmail, sendEmergencyVerificationEmail, sendCampusVerificationEmail } from "../controllers/enhancedEmailVerification.js";
import { submitCampusVerification, getVerificationStatus, upload } from "../controllers/v1VerificationController.js";

const router = express.Router();

// Enhanced email-based verification (no SMS costs)
router.post("/phone/send-email", verifyToken, sendPhoneVerificationEmail);
router.post("/phone/verify", verifyToken, verifyPhoneCode);

// Emergency contact verification via email
router.post("/emergency/send-email", verifyToken, sendEmergencyVerificationEmail);
router.post("/emergency/verify", verifyToken, confirmEmergencyContact);

// Campus verification instructions via email
router.post("/campus/send-instructions", verifyToken, sendCampusVerificationEmail);

// Campus verification (file upload)
router.post("/campus/submit", verifyToken, upload.fields([
  { name: 'primaryDocument', maxCount: 1 },
  { name: 'secondaryDocument', maxCount: 1 },
  { name: 'selfieDocument', maxCount: 1 }
]), submitCampusVerification);

// Get verification status
router.get("/status", verifyToken, getVerificationStatus);

export default router;