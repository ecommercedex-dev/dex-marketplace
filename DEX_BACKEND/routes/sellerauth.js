import express from "express";
import {
  registerSeller,
  verifySellerEmail,
  loginSeller,
  sendSellerResetCode,
  verifySellerResetCode,
  getSellerProfile,
  logoutSeller,
  resendVerification,
  deleteSellerAccount,
} from "../controllers/sellerauthcontroller.js";
import { registrationLimiter, loginLimiter } from "../middleware/rateLimitMiddleware.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===== Seller Authentication Routes =====

// V1 Secure routes with rate limiting
router.post("/sellers/register", registrationLimiter, registerSeller);
router.post("/sellers/verify-email", verifySellerEmail);
router.post("/sellers/resend-verification", resendVerification);
router.post("/sellers/login", loginLimiter, loginSeller);
router.post("/sellers/send-reset-code", sendSellerResetCode);
router.post("/sellers/verify-reset-code", verifySellerResetCode);
router.get("/sellers/profile", verifyToken, getSellerProfile);
router.post("/sellers/logout", logoutSeller);

// ===== Settings Routes =====
import prisma from "../lib/prisma.js";

router.patch("/sellers/update-profile", verifyToken, async (req, res) => {
  const { name, storeName, email, phone } = req.body;
  try {
    const updated = await prisma.seller.update({
      where: { id: req.user.id },
      data: { name, storeName, email, phone }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/sellers/change-password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const bcrypt = await import("bcrypt");
  try {
    const seller = await prisma.seller.findUnique({ where: { id: req.user.id } });
    if (!seller) return res.status(404).json({ error: "Seller not found" });
    const valid = await bcrypt.compare(currentPassword, seller.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.seller.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/sellers/delete-account", verifyToken, deleteSellerAccount);

router.post("/sellers/support-ticket", verifyToken, async (req, res) => {
  const { subject, message } = req.body;
  try {
    await prisma.supportTicket.create({
      data: { sellerId: req.user.id, subject, message }
    });
    res.json({ message: "Ticket submitted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Analytics Route =====
router.get("/sellers/analytics", verifyToken, async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    const [products, orders, wishlistCount, followers] = await Promise.all([
      prisma.product.findMany({ where: { sellerId }, select: { id: true, price: true, stock: true } }),
      prisma.order.findMany({ where: { sellerId } }),
      prisma.wishlist.count({ where: { product: { sellerId } } }),
      prisma.sellerFollow.count({ where: { sellerId } })
    ]);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    res.json({
      totalProducts: products.length,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      wishlistCount,
      followers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
