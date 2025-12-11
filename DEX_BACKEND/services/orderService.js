import { PrismaClient } from "@prisma/client";
import { pushNotification } from "../server.js";

const prisma = new PrismaClient();
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// -------------------- ORDER SERVICES & CONTROLLERS --------------------

// ---------------- Buyer Functions ----------------

// Create Order (Buyer only)
export async function createOrderController(req, res) {
  try {
    const { productId, buyerId, quantity, address } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
    if (!address || address.trim() === "") {
      return res.status(400).json({ error: "Address is required" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (!product.deployed) {
      return res.status(400).json({ error: "Product not available" });
    }
    if (product.stock !== null && product.stock < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    const totalPrice = product.price * quantity;
    const buyer = await prisma.buyer.findUnique({ where: { id: buyerId } });

    const productImageUrl = product.images?.[0]
      ? product.images[0].startsWith("http")
        ? product.images[0]
        : `${BACKEND_URL}${product.images[0]}`
      : null;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          productId,
          buyerId,
          sellerId: product.sellerId,
          quantity,
          totalPrice,
          address,
          productImage: productImageUrl,
        },
      });

      const notification = await tx.notification.create({
        data: {
          sellerId: product.sellerId,
          title: "🎉 New Order!",
          message: `${buyer?.name || "A buyer"} ordered ${quantity}x ${
            product.name
          } (₵${totalPrice.toFixed(2)}). Click to view and accept!`,
          type: "order",
          orderId: order.id,
        },
      });

      return { order, notification };
    });

    pushNotification(product.sellerId.toString(), result.notification);

    res.status(201).json(result.order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Get Buyer Orders
export async function getBuyerOrdersController(req, res) {
  try {
    const buyerId = Number(req.params.buyerId);
    if (isNaN(buyerId))
      return res.status(400).json({ error: "Invalid buyer ID" });

    const orders = await prisma.order.findMany({
      where: { buyerId },
      include: { product: true, seller: true },
      orderBy: { createdAt: "desc" },
    });

    const sanitizedOrders = orders.map((order) => ({
      ...order,
      seller: {
        id: order.seller.id,
        name: order.seller.name,
        storeName: order.seller.storeName,
        profilePic: order.seller.profilePic,
        ...(["accepted", "delivered"].includes(order.status) && {
          phone: order.seller.phone,
          email: order.seller.email,
        }),
      },
      canContactSeller: ["accepted", "delivered"].includes(order.status),
    }));

    res.json(sanitizedOrders);
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}

// ---------------- Seller Functions ----------------

// Get Seller Orders
export async function getSellerOrdersController(req, res) {
  try {
    const sellerId = Number(req.params.sellerId);
    if (isNaN(sellerId))
      return res.status(400).json({ error: "Invalid seller ID" });

    const orders = await prisma.order.findMany({
      where: { sellerId },
      include: { product: true, buyer: true },
      orderBy: { createdAt: "desc" },
    });

    const sanitizedOrders = orders.map((order) => ({
      ...order,
      buyer: {
        id: order.buyer.id,
        name: order.buyer.name,
        profilePic: order.buyer.profilePic,
        ...(["accepted", "delivered"].includes(order.status) && {
          phone: order.buyer.number,
          email: order.buyer.email,
        }),
      },
      canContactBuyer: ["accepted", "delivered"].includes(order.status),
    }));

    res.json(sanitizedOrders);
  } catch (err) {
    console.error("getSellerOrdersController error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}

// Update Order Status (Seller only)
export async function updateOrderStatusController(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    
    const { status, sellerId } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });
    if (!sellerId || isNaN(Number(sellerId))) {
      return res.status(400).json({ error: "Invalid seller ID" });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (existingOrder.sellerId !== sellerId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const validTransitions = {
      pending: ["accepted", "rejected"],
      accepted: ["delivered", "cancelled"],
      rejected: [],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[existingOrder.status]?.includes(status)) {
      return res.status(400).json({ error: "Invalid status transition" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status },
        include: { buyer: true, seller: true, product: true },
      });

      if (status === "accepted" && order.product.stock !== null) {
        await tx.product.update({
          where: { id: order.productId },
          data: { stock: { decrement: order.quantity } },
        });
      }

      if (status === "rejected" || status === "cancelled") {
        if (existingOrder.status === "accepted" && order.product.stock !== null) {
          await tx.product.update({
            where: { id: order.productId },
            data: { stock: { increment: order.quantity } },
          });
        }
      }

      const notification = await tx.notification.create({
        data: {
          buyerId: order.buyerId,
          title: `Order ${status}`,
          message: `Your order for ${order.product.name} is now ${status}`,
          type: "order",
        },
      });

      return { order, notification };
    });

    pushNotification(result.order.buyerId.toString(), result.notification);

    res.json(result.order);
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(400).json({ error: "Failed to update order status" });
  }
}

// Cancel Order (Buyer only)
export async function cancelOrderController(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    
    const { buyerId } = req.body;
    if (!buyerId || isNaN(Number(buyerId))) {
      return res.status(400).json({ error: "Invalid buyer ID" });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true, seller: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (existingOrder.buyerId !== buyerId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (existingOrder.status !== "pending") {
      return res.status(400).json({ error: "Only pending orders can be cancelled" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: "cancelled" },
        include: { buyer: true, seller: true, product: true },
      });

      const notification = await tx.notification.create({
        data: {
          sellerId: order.sellerId,
          title: "Order Cancelled",
          message: `${order.buyer.name} cancelled their order for ${order.product.name}`,
          type: "order",
        },
      });

      return { order, notification };
    });

    pushNotification(result.order.sellerId.toString(), result.notification);

    res.json(result.order);
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(400).json({ error: "Failed to cancel order" });
  }
}

// Clear Orders by Status (Buyer)
export async function clearBuyerOrdersByStatusController(req, res) {
  try {
    const { status } = req.params;
    const buyerId = req.user.id;

    const validStatuses = ["delivered", "rejected", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const statusFilter = status === "rejected" ? ["rejected", "cancelled"] : [status];

    const result = await prisma.order.deleteMany({
      where: {
        buyerId,
        status: { in: statusFilter },
      },
    });

    res.json({ message: `Cleared ${result.count} orders`, count: result.count });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Clear Orders by Status (Seller)
export async function clearSellerOrdersByStatusController(req, res) {
  try {
    const { status } = req.params;
    const sellerId = req.user.id;

    const validStatuses = ["delivered", "rejected", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const statusFilter = status === "rejected" ? ["rejected", "cancelled"] : [status];

    const result = await prisma.order.deleteMany({
      where: {
        sellerId,
        status: { in: statusFilter },
      },
    });

    res.json({ message: `Cleared ${result.count} orders`, count: result.count });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
