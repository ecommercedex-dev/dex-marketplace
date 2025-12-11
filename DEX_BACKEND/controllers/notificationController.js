import { PrismaClient } from "@prisma/client";
import { pushNotification } from "../server.js"; // WebSocket helper

const prisma = new PrismaClient();

/* ============================================================
   1. ACCOUNT VERIFICATION NOTIFICATION  (Buyer + Seller)
   ============================================================ */
export const notifyVerification = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role)
      return res.status(400).json({ message: "Missing email or role" });

    let user;

    if (role === "buyer") {
      user = await prisma.buyer.update({
        where: { email },
        data: { isVerified: true },
      });
    } else if (role === "seller") {
      user = await prisma.seller.update({
        where: { email },
        data: { isVerified: true },
      });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    const notif = await prisma.notification.create({
      data: {
        [role === "buyer" ? "buyerId" : "sellerId"]: user.id,
        title: "Account Verified",
        message: "Your account has been successfully verified!",
        type: "verification",
      },
    });

    // Real-time push only for sellers
    if (role === "seller") pushNotification(user.id, notif);

    res.json({ message: "Verified & notified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   2. UNIVERSAL CREATE NOTIFICATION  (Reusable)
   ============================================================ */
export const createNotification = async ({
  buyerId,
  sellerId,
  title,
  message,
  type = "system",
}) => {
  try {
    const notif = await prisma.notification.create({
      data: {
        buyerId: buyerId || undefined,
        sellerId: sellerId || undefined,
        title,
        message,
        type,
      },
    });

    // 🔥 Real-time notifications for both buyer & seller
    if (sellerId) pushNotification(sellerId, notif);
    if (buyerId) pushNotification(buyerId, notif);

    return notif;
  } catch (err) {
    console.error("Notification create failed:", err);
    throw err;
  }
};

/* ============================================================
   3. GET NOTIFICATIONS (Buyer + Seller)
   ============================================================ */
export const getNotifications = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    const where =
      role === "seller"
        ? { sellerId: userId }
        : role === "buyer"
        ? { buyerId: userId }
        : null;

    if (!where) return res.status(403).json({ message: "Invalid role" });

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4. MARK NOTIFICATION AS READ (Buyer + Seller)
   ============================================================ */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const notif = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notif) return res.status(404).json({ message: "Not found" });

    if (role === "seller" && notif.sellerId !== userId)
      return res.status(403).json({ message: "Not yours" });

    if (role === "buyer" && notif.buyerId !== userId)
      return res.status(403).json({ message: "Not yours" });

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   5. CLEAR ALL NOTIFICATIONS (Buyer + Seller)
   ============================================================ */
export const clearAllNotifications = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    const where =
      role === "seller"
        ? { sellerId: userId }
        : role === "buyer"
        ? { buyerId: userId }
        : null;

    if (!where) return res.status(403).json({ message: "Invalid role" });

    await prisma.notification.deleteMany({ where });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
