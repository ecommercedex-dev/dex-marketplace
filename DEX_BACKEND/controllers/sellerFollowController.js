import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Follow seller (BUYERS ONLY - sellers cannot follow)
export const followSeller = async (req, res) => {
  try {
    const { sellerId } = req.body;
    const userId = req.user.id;

    // Check if user is a buyer
    const buyer = await prisma.buyer.findUnique({ where: { id: userId } });
    if (!buyer) {
      return res.status(403).json({ message: "Only buyers can follow sellers" });
    }

    // Prevent self-follow (if buyer is somehow also a seller)
    if (userId === parseInt(sellerId)) {
      return res.status(403).json({ message: "You can't follow your own profile" });
    }

    const existing = await prisma.sellerFollow.findFirst({
      where: { buyerId: userId, sellerId: parseInt(sellerId) }
    });

    if (existing) {
      return res.status(400).json({ message: 'Already following' });
    }

    await prisma.sellerFollow.create({
      data: { buyerId: userId, sellerId: parseInt(sellerId) }
    });

    const count = await prisma.sellerFollow.count({
      where: { sellerId: parseInt(sellerId) }
    });

    res.json({ message: 'Following seller', followers: count });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Unfollow seller
export const unfollowSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const buyerId = req.user.id;

    await prisma.sellerFollow.deleteMany({
      where: { buyerId, sellerId: parseInt(sellerId) }
    });

    const count = await prisma.sellerFollow.count({
      where: { sellerId: parseInt(sellerId) }
    });

    res.json({ message: 'Unfollowed seller', followers: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get follow status
export const getFollowStatus = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const buyerId = req.user.id;

    const isFollowing = await prisma.sellerFollow.findFirst({
      where: { buyerId, sellerId: parseInt(sellerId) }
    });

    const count = await prisma.sellerFollow.count({
      where: { sellerId: parseInt(sellerId) }
    });

    res.json({ isFollowing: !!isFollowing, followers: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Like seller (BUYERS ONLY - sellers cannot like)
export const likeSeller = async (req, res) => {
  try {
    const { sellerId } = req.body;
    const userId = req.user.id;

    // Check if user is a buyer
    const buyer = await prisma.buyer.findUnique({ where: { id: userId } });
    if (!buyer) {
      return res.status(403).json({ message: "Only buyers can like sellers" });
    }

    // Prevent self-like (if buyer is somehow also a seller)
    if (userId === parseInt(sellerId)) {
      return res.status(403).json({ message: "You can't like your own profile" });
    }

    const existing = await prisma.sellerLike.findFirst({
      where: { buyerId: userId, sellerId: parseInt(sellerId) }
    });

    if (existing) {
      return res.status(400).json({ message: 'Already liked' });
    }

    await prisma.sellerLike.create({
      data: { buyerId: userId, sellerId: parseInt(sellerId) }
    });

    await prisma.notification.create({
      data: {
        sellerId: parseInt(sellerId),
        message: `${buyer.name} liked your profile`,
        type: 'like',
        title: 'New Like'
      }
    });

    const count = await prisma.sellerLike.count({
      where: { sellerId: parseInt(sellerId) }
    });

    res.json({ message: 'Liked seller', likes: count });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Unlike seller
export const unlikeSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const buyerId = req.user.id;

    await prisma.sellerLike.deleteMany({
      where: { buyerId, sellerId: parseInt(sellerId) }
    });

    const count = await prisma.sellerLike.count({
      where: { sellerId: parseInt(sellerId) }
    });

    res.json({ message: 'Unliked seller', likes: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get like status
export const getLikeStatus = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const buyerId = req.user.id;

    const isLiked = await prisma.sellerLike.findFirst({
      where: { buyerId, sellerId: parseInt(sellerId) }
    });

    const count = await prisma.sellerLike.count({
      where: { sellerId: parseInt(sellerId) }
    });

    res.json({ isLiked: !!isLiked, likes: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get followers list
export const getFollowers = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const followers = await prisma.sellerFollow.findMany({
      where: { sellerId: parseInt(sellerId) },
      include: {
        buyer: {
          select: { id: true, name: true, profilePic: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ followers, count: followers.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get likes count
export const getLikes = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const count = await prisma.sellerLike.count({
      where: { sellerId: parseInt(sellerId) }
    });

    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
