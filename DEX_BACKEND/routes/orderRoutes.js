import express from "express";
import {
  createOrderController,
  getOrdersController,
  updateOrderStatusController,
  cancelOrderController,
  deliverOrderController,
  clearBuyerOrdersByStatusController,
  clearSellerOrdersByStatusController,
  sendMessageController,
  getMessagesController,
  markMessagesReadController,
} from "../controllers/orderController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { checkRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Create order (buyers only)
router.post(
  "/create",
  verifyToken,
  checkRole(["buyer"]),
  createOrderController
);

// Get orders for logged-in user (buyer or seller)
router.get("/", verifyToken, getOrdersController);

// Cancel order (buyers only)
router.patch(
  "/:orderId/cancel",
  verifyToken,
  checkRole(["buyer"]),
  cancelOrderController
);

// Update order status (sellers only)
router.patch(
  "/:orderId/status",
  verifyToken,
  checkRole(["seller"]),
  updateOrderStatusController
);

// Mark order as delivered + reduce stock (sellers only)
router.patch(
  "/:orderId/deliver",
  verifyToken,
  checkRole(["seller"]),
  deliverOrderController
);

// Clear orders by status (buyers)
router.delete(
  "/clear/:status",
  verifyToken,
  checkRole(["buyer"]),
  clearBuyerOrdersByStatusController
);

// Clear orders by status (sellers)
router.delete(
  "/seller/clear/:status",
  verifyToken,
  checkRole(["seller"]),
  clearSellerOrdersByStatusController
);

// Send message
router.post("/:orderId/messages", verifyToken, sendMessageController);

// Get messages
router.get("/:orderId/messages", verifyToken, getMessagesController);

// Mark messages as read
router.patch("/:orderId/messages/read", verifyToken, markMessagesReadController);

export default router;
