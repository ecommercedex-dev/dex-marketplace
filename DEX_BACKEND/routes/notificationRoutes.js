import express from "express";
import {
  getNotifications,
  markAsRead,
  clearAllNotifications,
  createNotification,
} from "../controllers/notificationController.js";
import { verifyToken, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===============================
// 🔵 CREATE NOTIFICATION (Seller or Buyer)
// ===============================
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const { id: userId, role } = req.user;

    if (!title) return res.status(400).json({ message: "Title is required" });

    // Send notification to the current user’s role
    const notif =
      role === "seller"
        ? await createNotification({ sellerId: userId, title, message, type })
        : await createNotification({ buyerId: userId, title, message, type });

    res.status(201).json(notif);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// 🔵 GET NOTIFICATIONS (Seller or Buyer)
// ===============================
router.get("/", verifyToken, getNotifications);

// ===============================
// 🔵 MARK NOTIFICATION AS READ
// ===============================
router.post("/:id/read", verifyToken, markAsRead);

// ===============================
// 🔵 CLEAR ALL NOTIFICATIONS
// ===============================
router.post("/clear", verifyToken, clearAllNotifications);

export default router;
