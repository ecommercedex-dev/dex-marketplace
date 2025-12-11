// controllers/orderController.js
import prisma from "../lib/prisma.js"; // Import prisma here
import {
  createOrderController as serviceCreateOrder,
  getSellerOrdersController as serviceGetSellerOrders,
  getBuyerOrdersController as serviceGetBuyerOrders,
  updateOrderStatusController as serviceUpdateOrderStatus,
  cancelOrderController as serviceCancelOrder,
  clearBuyerOrdersByStatusController as serviceClearBuyerOrders,
  clearSellerOrdersByStatusController as serviceClearSellerOrders,
} from "../services/orderService.js";

/**
 * Create order (only buyers)
 */
export async function createOrderController(req, res) {
  if (!req.user || req.user.role !== "buyer") {
    return res.status(403).json({ error: "Only buyers can create orders" });
  }

  try {
    const { productId, quantity } = req.body;
    
    // Check if product is in stock
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: { seller: true }
    });
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    if (product.stock <= 0) {
      // Send notification to seller about out-of-stock attempt
      await prisma.notification.create({
        data: {
          sellerId: product.sellerId,
          title: "Out of Stock Alert",
          message: `A buyer tried to order "${product.name}" but it's out of stock. Consider restocking this item.`,
          type: "stock_alert"
        }
      });
      
      return res.status(400).json({ 
        error: "This item is currently out of stock",
        outOfStock: true
      });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ 
        error: `Only ${product.stock} items available`,
        availableStock: product.stock
      });
    }
    
    // Ensure the buyerId comes from the authenticated user
    req.body.buyerId = req.user.id;
    return serviceCreateOrder(req, res);
  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({ error: "Failed to create order" });
  }
}

/**
 * Get orders for the logged-in user
 */
export async function getOrdersController(req, res) {
  if (!req.user) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (req.user.role === "seller") {
    req.params.sellerId = req.user.id; // enforce sellerId from token
    return serviceGetSellerOrders(req, res);
  } else if (req.user.role === "buyer") {
    req.params.buyerId = req.user.id; // enforce buyerId from token
    return serviceGetBuyerOrders(req, res);
  } else {
    return res.status(403).json({ error: "Invalid role" });
  }
}

/**
 * Update order status (only sellers)
 */
export async function updateOrderStatusController(req, res) {
  if (!req.user || req.user.role !== "seller") {
    return res
      .status(403)
      .json({ error: "Only sellers can update order status" });
  }
  req.body.sellerId = req.user.id;
  return serviceUpdateOrderStatus(req, res);
}

/**
 * Cancel order (only buyers)
 */
export async function cancelOrderController(req, res) {
  if (!req.user || req.user.role !== "buyer") {
    return res.status(403).json({ error: "Only buyers can cancel orders" });
  }
  if (!req.body) req.body = {};
  req.body.buyerId = req.user.id;
  return serviceCancelOrder(req, res);
}

/**
 * Mark order as delivered (only sellers)
 * Note: Stock is already reduced when order is accepted
 */
export async function deliverOrderController(req, res) {
  if (!req.user || req.user.role !== "seller") {
    return res.status(403).json({ error: "Only sellers can deliver orders" });
  }
  
  try {
    const { orderId } = req.params;
    const sellerId = req.user.id;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { product: true },
    });

    if (!order || order.sellerId !== sellerId) {
      return res
        .status(404)
        .json({ error: "Order not found or access denied" });
    }

    if (order.status !== "accepted") {
      return res
        .status(400)
        .json({ error: "Only accepted orders can be marked as delivered" });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: "delivered" },
      include: { buyer: true, product: true },
    });

    const notification = await prisma.notification.create({
      data: {
        buyerId: updatedOrder.buyerId,
        title: "Order Delivered",
        message: `Your order for ${updatedOrder.product.name} has been delivered`,
        type: "order",
      },
    });

    const { pushNotification } = await import("../server.js");
    pushNotification(updatedOrder.buyerId.toString(), notification);

    res.json({ message: "Order successfully marked as delivered" });
  } catch (err) {
    console.error("Deliver order error:", err);
    res.status(500).json({ error: "Failed to deliver order" });
  }
}

/**
 * Clear orders by status (buyers)
 */
export async function clearBuyerOrdersByStatusController(req, res) {
  if (!req.user || req.user.role !== "buyer") {
    return res.status(403).json({ error: "Only buyers can clear orders" });
  }
  return serviceClearBuyerOrders(req, res);
}

/**
 * Clear orders by status (sellers)
 */
export async function clearSellerOrdersByStatusController(req, res) {
  if (!req.user || req.user.role !== "seller") {
    return res.status(403).json({ error: "Only sellers can clear orders" });
  }
  return serviceClearSellerOrders(req, res);
}

/**
 * Send message
 */
export async function sendMessageController(req, res) {
  try {
    const { orderId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (userRole === "buyer" && order.buyerId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (userRole === "seller" && order.sellerId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const newMessage = await prisma.orderMessage.create({
      data: {
        orderId: parseInt(orderId),
        senderId: userId,
        senderType: userRole,
        message,
      },
    });

    const { pushNotification } = await import("../server.js");
    const recipientId = userRole === "buyer" ? order.sellerId : order.buyerId;
    const notification = await prisma.notification.create({
      data: {
        [userRole === "buyer" ? "sellerId" : "buyerId"]: recipientId,
        title: "New Message",
        message: `New message about order #${String(orderId).slice(-8)}`,
        type: "message",
        orderId: parseInt(orderId),
      },
    });
    pushNotification(recipientId.toString(), notification);

    res.json(newMessage);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
}

/**
 * Get messages
 */
export async function getMessagesController(req, res) {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (userRole === "buyer" && order.buyerId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (userRole === "seller" && order.sellerId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const messages = await prisma.orderMessage.findMany({
      where: { orderId: parseInt(orderId) },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Failed to get messages" });
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesReadController(req, res) {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (userRole === "buyer" && order.buyerId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (userRole === "seller" && order.sellerId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.orderMessage.updateMany({
      where: {
        orderId: parseInt(orderId),
        senderType: { not: userRole },
        read: false,
      },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Mark messages read error:", err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
}
