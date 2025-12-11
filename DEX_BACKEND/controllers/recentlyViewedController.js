import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Add a product to recently viewed
export async function addRecentlyViewed(req, res) {
  try {
    const { buyerId, productId } = req.body;

    if (!buyerId || !productId) {
      return res
        .status(400)
        .json({ message: "buyerId and productId required" });
    }

    // Upsert: if already exists, update timestamp; else, create
    const record = await prisma.recentlyViewed.upsert({
      where: { buyerId_productId: { buyerId, productId } },
      update: { createdAt: new Date() },
      create: { buyerId, productId },
    });

    return res.status(200).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add recently viewed" });
  }
}

// Get a buyer's recently viewed products
export async function getRecentlyViewed(req, res) {
  try {
    const { buyerId } = req.params;

    if (!buyerId) {
      return res.status(400).json({ message: "buyerId required" });
    }

    const recentlyViewed = await prisma.recentlyViewed.findMany({
      where: { buyerId: parseInt(buyerId) },
      orderBy: { createdAt: "desc" }, // most recent first
      include: { product: true }, // fetch product details
    });

    res.status(200).json(recentlyViewed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recently viewed" });
  }
}

// Optional: remove a recently viewed product
export async function removeRecentlyViewed(req, res) {
  try {
    const { buyerId, productId } = req.body;

    if (!buyerId || !productId) {
      return res
        .status(400)
        .json({ message: "buyerId and productId required" });
    }

    await prisma.recentlyViewed.delete({
      where: { buyerId_productId: { buyerId, productId } },
    });

    res.status(200).json({ message: "Recently viewed item removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove recently viewed" });
  }
}
