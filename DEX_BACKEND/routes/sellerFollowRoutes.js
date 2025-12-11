import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { followSeller, unfollowSeller, getFollowStatus, likeSeller, unlikeSeller, getLikeStatus, getFollowers, getLikes } from '../controllers/sellerFollowController.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.post('/follow', verifyToken, followSeller);
router.delete('/follow/:sellerId', verifyToken, unfollowSeller);
router.get('/follow/:sellerId', verifyToken, getFollowStatus);

router.post('/like', verifyToken, likeSeller);
router.delete('/like/:sellerId', verifyToken, unlikeSeller);
router.get('/like/:sellerId', verifyToken, getLikeStatus);

router.get('/followers/:sellerId', getFollowers);
router.get('/likes/:sellerId', getLikes);
router.get('/following', verifyToken, async (req, res) => {
  try {
    const follows = await prisma.sellerFollow.findMany({
      where: { buyerId: req.user.id },
      include: { 
        seller: {
          include: {
            products: { where: { deployed: true } },
            shopSettings: true
          }
        }
      }
    });
    res.json(follows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
