import express from "express";
import { upload, submitStudentID } from "../controllers/studentVerificationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/submit-student-id", verifyToken, upload.single('studentID'), submitStudentID);

export default router;