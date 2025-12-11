import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* ===========================
      ADD A REVIEW
=========================== */
/* ===========================
      ADD A REVIEW + NOTIFY SELLER
=========================== */
export const addReview = async (req, res) => {
  try {
    const buyerId = req.user.id; // from verifyToken middleware
    const { productId, rating, comment } = req.body;

    // Check if user is a buyer
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ message: "Only buyers can review products" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1–5" });
    }

    // Ensure product exists
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
      include: { seller: true },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    // Ensure buyer hasn't reviewed this product before
    const existingReview = await prisma.review.findFirst({
      where: { productId: Number(productId), buyerId },
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product." });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment,
        buyerId,
        productId: Number(productId),
      },
      include: {
        buyer: true,
      },
    });

    // Create a notification for the seller
    if (product.sellerId) {
      await prisma.notification.create({
        data: {
          sellerId: product.sellerId,
          title: "New Review",
          message: `${review.buyer.name} reviewed your product "${product.name}"`,
          type: "review",
          read: false,
        },
      });
    }

    res.status(201).json(review);
  } catch (err) {
    console.error("Add Review Error:", err);
    res.status(500).json({ message: "Server error adding review", error: err });
  }
};

/* ===========================
   GET REVIEWS FOR A PRODUCT
=========================== */
export const getProductReviews = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            profilePic: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(reviews);
  } catch (err) {
    console.error("Get Product Reviews Error:", err);
    res.status(500).json({ message: "Server error fetching reviews" });
  }
};

/* ===========================
   GET REVIEWS BY A BUYER
=========================== */
export const getBuyerReviews = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const reviews = await prisma.review.findMany({
      where: { buyerId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(reviews);
  } catch (err) {
    console.error("Get Buyer Reviews Error:", err);
    res.status(500).json({ message: "Server error fetching user reviews" });
  }
};
