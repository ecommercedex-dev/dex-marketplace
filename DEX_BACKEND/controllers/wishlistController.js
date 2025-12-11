import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* ============================================================
   GET WISHLIST FOR BUYER
   ============================================================ */
export async function getWishlist(req, res) {
  try {
    const buyerId = req.user.id;

    const wishlist = await prisma.wishlist.findMany({
      where: { buyerId },
      select: {
        id: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
            category: true,
            subCategory: true, // ✅ include subcategory
            images: true,
            createdAt: true,
            seller: {
              select: {
                id: true,
                name: true,
                profilePic: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(wishlist);
  } catch (err) {
    console.error("❌ Wishlist Fetch Error:", err);
    res.status(500).json({ message: "Server error fetching wishlist" });
  }
}

/* ============================================================
   ADD PRODUCT TO WISHLIST + NOTIFICATIONS (WITH IMAGE URL FIX)
   ============================================================ */
export async function addToWishlist(req, res) {
  try {
    const buyerId = req.user.id;
    const { productId } = req.body;

    if (!productId)
      return res.status(400).json({ message: "productId is required" });

    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:5000";

    // Fetch product + seller info
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
      include: { seller: true },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    // Fetch buyer info
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
    });

    // Prevent duplicates
    const existing = await prisma.wishlist.findUnique({
      where: {
        buyerId_productId: { buyerId, productId: Number(productId) },
      },
    });

    if (existing)
      return res.status(400).json({ message: "Already in wishlist" });

    // Create wishlist entry
    const newWishlistItem = await prisma.wishlist.create({
      data: { buyerId, productId: Number(productId) },
    });

    // 🔔 Seller notification with rich details
    if (product.sellerId) {
      const productImage = product.images?.[0] || null;
      const buyerAvatar = buyer.profilePic || null;
      
      const notification = await prisma.notification.create({
        data: {
          sellerId: product.sellerId,
          title: "💝 Product Wishlisted!",
          message: JSON.stringify({
            buyerName: buyer.name,
            buyerAvatar: buyerAvatar,
            productName: product.name,
            productImage: productImage,
            productPrice: product.price,
            action: "wishlisted"
          }),
          type: "wishlist",
        },
      });
      console.log('✅ Wishlist notification created:', notification.id);
    }

    return res.status(201).json({
      message: "Added to wishlist",
      wishlist: newWishlistItem,
    });
  } catch (err) {
    console.error("❌ Wishlist Add Error:", err);
    res.status(500).json({ message: "Server error adding to wishlist" });
  }
}

/* ============================================================
   REMOVE PRODUCT FROM WISHLIST
   ============================================================ */
export async function removeFromWishlist(req, res) {
  try {
    const buyerId = req.user.id;
    const { productId } = req.params;

    if (!productId)
      return res.status(400).json({ message: "productId is required" });

    await prisma.wishlist.delete({
      where: {
        buyerId_productId: {
          buyerId,
          productId: Number(productId),
        },
      },
    });

    return res.json({ message: "Removed from wishlist" });
  } catch (err) {
    console.error("❌ Wishlist Remove Error:", err);

    // If not found (Prisma error code P2025)
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }

    res.status(500).json({ message: "Server error removing wishlist item" });
  }
}
