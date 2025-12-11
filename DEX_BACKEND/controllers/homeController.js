import prisma from "../lib/prisma.js";

export const getStats = async (req, res) => {
  try {
    const [products, sellers, orders, buyers] = await Promise.all([
      prisma.product.count({ where: { deployed: true } }),
      prisma.seller.count({ where: { isVerified: true } }),
      prisma.order.count(),
      prisma.buyer.count()
    ]);
    res.json({ products, sellers, orders, buyers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTestimonials = async (req, res) => {
  try {
    const reviews = await prisma.sellerReview.findMany({
      where: { rating: { gte: 4 }, comment: { not: null } },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { name: true, profilePic: true } },
        seller: { select: { storeName: true } }
      }
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFeaturedSellers = async (req, res) => {
  try {
    const sellers = await prisma.seller.findMany({
      where: { isVerified: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: { select: { rating: true } },
        products: { where: { deployed: true }, take: 1, select: { images: true } },
        _count: { select: { products: true, followers: true } }
      }
    });
    
    const enriched = sellers.map(s => ({
      id: s.id,
      name: s.storeName,
      profilePic: s.profilePic,
      category: s.productCategory,
      rating: s.reviews.length ? (s.reviews.reduce((a, r) => a + r.rating, 0) / s.reviews.length).toFixed(1) : 0,
      reviewCount: s.reviews.length,
      productCount: s._count.products,
      followers: s._count.followers,
      coverImage: s.products[0]?.images[0] || null,
      memberSince: s.createdAt
    }));
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTrendingProducts = async (req, res) => {
  try {
    const trending = await prisma.product.findMany({
      where: { deployed: true },
      take: 12,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            profilePic: true,
            isVerified: true,
            createdAt: true,
            reviews: { select: { rating: true } }
          }
        },
        _count: { select: { wishlists: true, orders: true } }
      }
    });

    const enriched = trending.map(p => ({
      ...p,
      sellerRating: p.seller.reviews.length ? (p.seller.reviews.reduce((a, r) => a + r.rating, 0) / p.seller.reviews.length).toFixed(1) : 0,
      reviewCount: p.seller.reviews.length,
      sellerVerified: p.seller.isVerified,
      sellerMemberSince: p.seller.createdAt,
      wishlistCount: p._count.wishlists,
      orderCount: p._count.orders
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }
    
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      await prisma.$executeRaw`
        INSERT INTO newsletter_subscribers (email, created_at)
        VALUES (${email}, NOW())
        ON CONFLICT (email) DO NOTHING
      `;
    } catch (dbErr) {
      console.log('Newsletter DB:', dbErr.message);
    }
    
    res.json({ message: "Subscribed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
