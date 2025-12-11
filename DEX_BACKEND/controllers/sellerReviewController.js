// controllers/sellerReviewController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ================= POST: Review a Seller =================
export const reviewSeller = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { sellerId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be 1–5 stars" });
    }

    const seller = await prisma.seller.findUnique({
      where: { id: parseInt(sellerId) },
    });

    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Prevent self-review
    if (seller.userId === buyerId) {
      return res.status(400).json({ message: "You cannot review yourself" });
    }

    // Check if already reviewed
    const existing = await prisma.sellerReview.findUnique({
      where: {
        sellerId_buyerId: {
          sellerId: parseInt(sellerId),
          buyerId,
        },
      },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this seller" });
    }

    const review = await prisma.sellerReview.create({
      data: {
        rating: parseInt(rating),
        comment: comment?.trim() || null,
        sellerId: parseInt(sellerId),
        buyerId,
      },
      include: {
        buyer: {
          select: { id: true, name: true, profilePic: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        sellerId: parseInt(sellerId),
        title: "New Shop Review",
        message: `${review.buyer.name} reviewed your shop with ${rating} stars`,
        type: "review",
        read: false,
      },
    });

    res.status(201).json({ message: "Review submitted!", review });
  } catch (err) {
    console.error("Review Seller Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET: All Reviews for a Seller =================
export const getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const reviews = await prisma.sellerReview.findMany({
      where: { sellerId: parseInt(sellerId) },
      include: {
        buyer: {
          select: { id: true, name: true, profilePic: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    res.json({
      averageRating: Number(averageRating.toFixed(2)),
      totalReviews,
      reviews,
    });
  } catch (err) {
    console.error("Get Seller Reviews Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
