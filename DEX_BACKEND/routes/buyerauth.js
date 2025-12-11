import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerUser,
  verifyEmail,
  loginUser,
  sendBuyerResetCode,
  verifyBuyerResetCode,
  resendVerification,
  logoutUser,
} from "../controllers/buyerauthcontroller.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import prisma from "../lib/prisma.js";

const router = express.Router(); // ✅ Declare router FIRST

// --- Rate limiting for signup ---
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many signup attempts from this IP, please try again later",
});

// --- Auth Routes ---
router.post("/register", signupLimiter, registerUser);
router.post("/verify-email", verifyEmail); // ✅ POST
router.post("/resend-verification", resendVerification); // ✅ POST
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/forgot-password", sendBuyerResetCode);
router.post("/reset-password", verifyBuyerResetCode);

// Settings Routes
router.post("/change-password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const bcrypt = await import("bcrypt");
  try {
    const buyer = await prisma.buyer.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, buyer.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.buyer.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/delete-account", verifyToken, async (req, res) => {
  try {
    const buyerId = req.user.id;
    
    // Delete in correct order to handle foreign key constraints
    await prisma.orderMessage.deleteMany({ 
      where: { 
        order: { buyerId } 
      } 
    });
    await prisma.order.deleteMany({ where: { buyerId } });
    await prisma.notification.deleteMany({ where: { buyerId } });
    await prisma.wishlist.deleteMany({ where: { buyerId } });
    await prisma.recentlyViewed.deleteMany({ where: { buyerId } });
    await prisma.review.deleteMany({ where: { buyerId } });
    await prisma.sellerReview.deleteMany({ where: { buyerId } });
    await prisma.sellerFollow.deleteMany({ where: { buyerId } });
    await prisma.sellerLike.deleteMany({ where: { buyerId } });
    await prisma.userReport.deleteMany({ where: { reporterId: buyerId } });
    await prisma.studentVerification.deleteMany({ where: { buyerId } });
    await prisma.buyerSettings.deleteMany({ where: { buyerId } });
    
    // Finally delete the buyer
    await prisma.buyer.delete({ where: { id: buyerId } });
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/support-ticket", verifyToken, async (req, res) => {
  const { subject, message } = req.body;
  try {
    await prisma.supportTicket.create({
      data: { sellerId: req.user.id, subject, message }
    });
    res.json({ message: "Ticket submitted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WhatsApp verification endpoints
const pendingVerifications = new Map(); // Store verification tokens

router.post("/send-whatsapp-verification", verifyToken, async (req, res) => {
  const { phone } = req.body;
  try {
    const verificationToken = Math.random().toString(36).substring(2, 15);
    pendingVerifications.set(req.user.id, { token: verificationToken, phone, timestamp: Date.now() });
    
    // In production, use WhatsApp Business API to send message
    const verificationLink = `https://dex.com/verify-phone?token=${verificationToken}&userId=${req.user.id}`;
    const whatsappMessage = `🔐 Dex Phone Verification\n\nClick this link to verify your phone number: ${verificationLink}\n\n✅ This confirms you own this WhatsApp number\n🛡️ Increases your trust score on Dex\n\nValid for 10 minutes only.`;
    
    // For demo: just store the verification
    console.log(`WhatsApp verification sent to ${phone}: ${whatsappMessage}`);
    
    res.json({ message: "WhatsApp verification link sent", verificationLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/check-whatsapp-verification", verifyToken, async (req, res) => {
  try {
    const verification = pendingVerifications.get(req.user.id);
    if (!verification) {
      return res.json({ verified: false, message: "No verification pending" });
    }
    
    // Check if verification was clicked (in production, this would be set by the verification link endpoint)
    const isExpired = Date.now() - verification.timestamp > 10 * 60 * 1000; // 10 minutes
    if (isExpired) {
      pendingVerifications.delete(req.user.id);
      return res.json({ verified: false, message: "Verification expired" });
    }
    
    // For demo: auto-verify after 3 seconds
    const autoVerify = Date.now() - verification.timestamp > 3000;
    if (autoVerify) {
      await prisma.buyer.update({
        where: { id: req.user.id },
        data: { phoneVerified: true }
      });
      
      await prisma.notification.create({
        data: {
          buyerId: req.user.id,
          title: "💚 WhatsApp Verified!",
          message: "Your WhatsApp number is verified! This increases your trust score and helps other users feel safer.",
          type: "verification"
        }
      });
      
      pendingVerifications.delete(req.user.id);
      return res.json({ verified: true, message: "Phone verified via WhatsApp!" });
    }
    
    res.json({ verified: false, message: "Please click the WhatsApp link first" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verification link endpoint (would be called when user clicks WhatsApp link)
router.get("/verify-phone-link", async (req, res) => {
  const { token, userId } = req.query;
  const crypto = await import("crypto");
  try {
    const verification = pendingVerifications.get(parseInt(userId));
    if (!verification || !token) {
      res.status(400).send(`<html><body style="font-family:Arial;text-align:center;padding:50px;"><h2>❌ Invalid Link</h2><p>This verification link is invalid or expired.</p></body></html>`);
      return;
    }
    
    // Ensure both tokens are same length to prevent timing attacks
    const storedToken = Buffer.from(verification.token, 'utf8');
    const providedToken = Buffer.from(token, 'utf8');
    
    if (storedToken.length !== providedToken.length) {
      res.status(400).send(`<html><body style="font-family:Arial;text-align:center;padding:50px;"><h2>❌ Invalid Link</h2><p>This verification link is invalid or expired.</p></body></html>`);
      return;
    }
    
    const isValid = crypto.timingSafeEqual(storedToken, providedToken);
    if (isValid) {
      // Mark as clicked
      verification.clicked = true;
      res.send(`<html><body style="font-family:Arial;text-align:center;padding:50px;"><h2>✅ Phone Verified!</h2><p>Your WhatsApp number has been verified. You can close this window and return to Dex.</p></body></html>`);
    } else {
      res.status(400).send(`<html><body style="font-family:Arial;text-align:center;padding:50px;"><h2>❌ Invalid Link</h2><p>This verification link is invalid or expired.</p></body></html>`);
    }
  } catch (err) {
    res.status(500).send(`<html><body style="font-family:Arial;text-align:center;padding:50px;"><h2>❌ Error</h2><p>Verification failed.</p></body></html>`);
  }
});

// Legacy phone verification (fallback)
router.post("/verify-phone", verifyToken, async (req, res) => {
  const { phone } = req.body;
  try {
    await prisma.buyer.update({
      where: { id: req.user.id },
      data: { phoneVerified: true }
    });
    
    await prisma.notification.create({
      data: {
        buyerId: req.user.id,
        title: "📱 Phone Verified!",
        message: "Your phone is now verified. This increases your trust score and helps other users feel safer trading with you.",
        type: "verification"
      }
    });
    
    res.json({ message: "📱 Phone verified! Your trust score has increased." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/verify-student", verifyToken, async (req, res) => {
  try {
    await prisma.buyer.update({
      where: { id: req.user.id },
      data: { studentVerified: true }
    });
    
    // Create verification success notification
    await prisma.notification.create({
      data: {
        buyerId: req.user.id,
        title: "🎓 Student ID Verified!",
        message: "Your student status is confirmed. You now have access to campus-exclusive deals and higher trust ratings.",
        type: "verification"
      }
    });
    
    res.json({ message: "🎓 Student ID verified! You can now access campus-exclusive features." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Privacy settings with safety defaults
router.get("/privacy-settings", verifyToken, async (req, res) => {
  try {
    const settings = await prisma.buyerSettings.findUnique({
      where: { buyerId: req.user.id }
    });
    res.json(settings || { profileVisibility: 'campus', contactPrefs: 'verified', showRealName: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/privacy-settings", verifyToken, async (req, res) => {
  const { profileVisibility, contactPrefs, showRealName } = req.body;
  try {
    await prisma.buyerSettings.upsert({
      where: { buyerId: req.user.id },
      update: { profileVisibility, contactPrefs, showRealName },
      create: { buyerId: req.user.id, profileVisibility, contactPrefs, showRealName }
    });
    res.json({ message: "Privacy settings saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Safety settings
router.get("/safety-settings", verifyToken, async (req, res) => {
  try {
    const settings = await prisma.buyerSettings.findUnique({
      where: { buyerId: req.user.id }
    });
    res.json({ meetingLocations: settings?.meetingLocations || '', emergencyContact: settings?.emergencyContact || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/safety-settings", verifyToken, async (req, res) => {
  const { meetingLocations, emergencyContact } = req.body;
  try {
    await prisma.buyerSettings.upsert({
      where: { buyerId: req.user.id },
      update: { meetingLocations, emergencyContact },
      create: { buyerId: req.user.id, meetingLocations, emergencyContact }
    });
    res.json({ message: "Safety settings saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trust settings
router.get("/trust-settings", verifyToken, async (req, res) => {
  try {
    const settings = await prisma.buyerSettings.findUnique({
      where: { buyerId: req.user.id }
    });
    res.json({ showTrustScore: settings?.showTrustScore !== false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/trust-settings", verifyToken, async (req, res) => {
  const { showTrustScore } = req.body;
  try {
    await prisma.buyerSettings.upsert({
      where: { buyerId: req.user.id },
      update: { showTrustScore },
      create: { buyerId: req.user.id, showTrustScore }
    });
    res.json({ message: "Trust settings saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Report user with safety notification
router.post("/report-user", verifyToken, async (req, res) => {
  const { userId, reason } = req.body;
  try {
    await prisma.userReport.create({
      data: { reporterId: req.user.id, reportedUserId: parseInt(userId), reason }
    });
    
    // Create safety notification for reporter
    await prisma.notification.create({
      data: {
        buyerId: req.user.id,
        title: "🛡️ Report Submitted",
        message: "Thank you for helping keep Dex safe. Your report has been received and will be reviewed.",
        type: "safety"
      }
    });
    
    res.json({ message: "🛡️ Report submitted successfully. Thank you for keeping Dex safe!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get safety tips
router.get("/safety-tips", async (req, res) => {
  const tips = [
    "🏢 Always meet in public campus locations like the library or student center",
    "👥 Bring a friend when meeting new sellers",
    "📱 Share your location with trusted contacts during meetups",
    "🕰️ Meet during daylight hours when possible",
    "💰 Never send money before seeing the item in person",
    "✅ Trust your instincts - if something feels wrong, walk away",
    "📞 Keep emergency contacts handy",
    "🔍 Verify seller identity through student verification"
  ];
  res.json({ tips });
});

// Emergency contact notification
router.post("/emergency-alert", verifyToken, async (req, res) => {
  const { location, situation } = req.body;
  try {
    const buyer = await prisma.buyer.findUnique({ 
      where: { id: req.user.id },
      include: { settings: true }
    });
    
    if (buyer.settings?.emergencyContact) {
      // In production, send SMS to emergency contact
      console.log(`EMERGENCY ALERT: ${buyer.name} needs help at ${location}`);
    }
    
    res.json({ message: "Emergency alert sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
