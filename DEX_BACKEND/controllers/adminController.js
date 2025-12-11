import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const ALLOWED_IPS = ['127.0.0.1', '::1']; // Allow localhost for development

// IP Whitelist Middleware
export const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  console.log('Admin access attempt from IP:', clientIP);
  
  // Allow localhost for development
  if (clientIP.includes('127.0.0.1') || clientIP.includes('::1')) {
    return next();
  }
  
  if (!ALLOWED_IPS.includes(clientIP)) {
    console.log('Blocked IP:', clientIP);
    return res.status(403).json({ message: "Access denied from this location" });
  }
  
  next();
};

// Enhanced Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password, secretKey } = req.body;
    console.log('Admin login attempt:', { email, hasSecretKey: !!secretKey });
    
    // Security Layer 1: Secret Key
    if (!process.env.ADMIN_SECRET_KEY || secretKey !== process.env.ADMIN_SECRET_KEY) {
      console.log('Invalid secret key attempt');
      return res.status(401).json({ message: "Access denied" });
    }
    
    // Security Layer 2: Database Check for Admin User
    const adminUser = await prisma.admin.findUnique({
      where: { email }
    });
    
    if (!adminUser) {
      console.log('Admin user not found:', email);
      return res.status(401).json({ message: "Admin not found" });
    }
    
    const validPassword = await bcrypt.compare(password, adminUser.password);
    if (!validPassword) {
      console.log('Invalid admin password:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const token = jwt.sign(
      { role: "admin", email, id: adminUser.id, timestamp: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    
    console.log('Admin login successful:', email);
    res.json({ token, message: "Admin access granted" });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: "Login failed" });
  }
};

// Get platform statistics
export const getStats = async (req, res) => {
  try {
    const [users, sellers, products, orders] = await Promise.all([
      prisma.buyer.count(),
      prisma.seller.count(),
      prisma.product.count(),
      prisma.order.count()
    ]);

    res.json({ users, sellers, products, orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.buyer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        number: true,
        isVerified: true,
        phoneVerified: true,
        studentVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Get all sellers
export const getSellers = async (req, res) => {
  try {
    const sellers = await prisma.seller.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        storeName: true,
        isVerified: true,
        phoneVerified: true,
        campusVerified: true,
        businessVerified: true,
        verificationTier: true,
        productCategory: true,
        createdAt: true,
        _count: { select: { products: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sellers" });
  }
};

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        deployed: true,
        createdAt: true,
        seller: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    
    // Map deployed to isActive for frontend compatibility
    const formattedProducts = products.map(product => ({
      ...product,
      isActive: product.deployed
    }));
    
    res.json(formattedProducts);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
};

// Get all orders
export const getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        buyer: { select: { name: true } },
        seller: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100 // Limit to recent 100 orders
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    const user = await prisma.buyer.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Delete related records first to avoid foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete user's orders
      await tx.order.deleteMany({ where: { buyerId: userId } });
      // Delete user's reviews
      await tx.review.deleteMany({ where: { buyerId: userId } });
      // Delete user's wishlist
      await tx.wishlist.deleteMany({ where: { buyerId: userId } });
      // Delete user's notifications
      await tx.notification.deleteMany({ where: { buyerId: userId } });
      // Delete user's recently viewed
      await tx.recentlyViewed.deleteMany({ where: { buyerId: userId } });
      // Delete user's seller reviews
      await tx.sellerReview.deleteMany({ where: { buyerId: userId } });
      // Delete user's seller follows
      await tx.sellerFollow.deleteMany({ where: { buyerId: userId } });
      // Delete user's seller likes
      await tx.sellerLike.deleteMany({ where: { buyerId: userId } });
      // Delete user's student verifications
      await tx.studentVerification.deleteMany({ where: { buyerId: userId } });
      // Delete user's settings
      await tx.buyerSettings.deleteMany({ where: { buyerId: userId } });
      // Finally delete the user
      await tx.buyer.delete({ where: { id: userId } });
    });
    
    console.log(`Admin deleted buyer #${id} (${user.email})`);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

// Delete seller
export const deleteSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = parseInt(id);
    
    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    
    // Delete related records first to avoid foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete seller's orders
      await tx.order.deleteMany({ where: { sellerId: sellerId } });
      // Delete seller's products
      await tx.product.deleteMany({ where: { sellerId: sellerId } });
      // Delete seller's reviews
      await tx.sellerReview.deleteMany({ where: { sellerId: sellerId } });
      // Delete seller's notifications
      await tx.notification.deleteMany({ where: { sellerId: sellerId } });
      // Delete seller's gallery images
      await tx.sellerGalleryImage.deleteMany({ where: { sellerId: sellerId } });
      // Delete seller's shop settings
      await tx.shopSettings.deleteMany({ where: { sellerId: sellerId } });
      // Delete seller's shop templates
      await tx.shopTemplate.deleteMany({ where: { sellerId: sellerId } });
      // Delete seller's followers
      await tx.sellerFollow.deleteMany({ where: { sellerId: sellerId } });
      // Delete seller's likes
      await tx.sellerLike.deleteMany({ where: { sellerId: sellerId } });
      // Delete seller's verification documents
      await tx.verificationDocument.deleteMany({ where: { sellerId: sellerId } });
      // Finally delete the seller
      await tx.seller.delete({ where: { id: sellerId } });
    });
    
    console.log(`Admin deleted seller #${id} (${seller.email})`);
    res.json({ message: "Seller deleted successfully" });
  } catch (error) {
    console.error('Delete seller error:', error);
    res.status(500).json({ message: "Failed to delete seller", error: error.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// Toggle product status
export const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    
    await prisma.product.update({
      where: { id: parseInt(id) },
      data: { isActive: !product.isActive }
    });
    
    res.json({ message: "Product status updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update product" });
  }
};

// Get campus verifications
export const getCampusVerifications = async (req, res) => {
  try {
    const verifications = await prisma.verificationDocument.findMany({
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            campusVerified: true
          }
        }
      },
      orderBy: { submittedAt: "desc" }
    });
    
    // Format for frontend
    const verificationsWithStatus = verifications.map(v => ({
      id: v.sellerId,
      name: v.seller.name,
      email: v.seller.email,
      verificationType: v.verificationType,
      status: v.status,
      documentsUploaded: !!(v.primaryDocPath || v.secondaryDocPath || v.selfieDocPath),
      primaryDocument: v.primaryDocPath,
      secondaryDocument: v.secondaryDocPath,
      selfieDocument: v.selfieDocPath,
      notes: v.notes,
      createdAt: v.submittedAt,
      lastUpdated: v.reviewedAt || v.submittedAt,
      documentId: v.id
    }));
    
    res.json(verificationsWithStatus);
  } catch (error) {
    console.error('Get campus verifications error:', error);
    res.status(500).json({ message: "Failed to fetch campus verifications" });
  }
};

// Review campus verification
export const reviewCampusVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, adminId, reviewedAt } = req.body;
    
    const updateData = { 
      campusVerified: status === 'approved' ? true : false,
      verificationTier: status === 'approved' ? 2 : 1,
      updatedAt: new Date()
    };
    
    // Handle rejection - log reason but don't store in DB until field is added
    if (status === 'rejected') {
      updateData.campusVerified = false;
      console.log(`Rejection reason for seller ${id}: ${reason || 'No reason provided'}`);
    }
    
    // Update verification document
    await prisma.verificationDocument.update({
      where: { sellerId: parseInt(id) },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: adminId || 'unknown_admin',
        rejectionReason: status === 'rejected' ? reason : null
      }
    });
    
    // Update seller
    const updatedSeller = await prisma.seller.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    // Log admin action for audit trail
    const auditLog = {
      action: `campus_verification_${status}`,
      sellerId: parseInt(id),
      sellerEmail: updatedSeller.email,
      adminId: adminId || 'unknown_admin',
      reason: reason || null,
      timestamp: reviewedAt || new Date().toISOString(),
      details: {
        previousStatus: updatedSeller.campusVerified ? 'verified' : 'unverified',
        newStatus: status,
        verificationTier: updateData.verificationTier
      }
    };
    
    console.log('Campus Verification Admin Action:', JSON.stringify(auditLog, null, 2));
    
    // TODO: Send email notification to seller
    const emailMessage = status === 'approved' ? 
      'Congratulations! Your campus verification has been approved.' :
      `Your campus verification was not approved. Reason: ${reason || 'Please contact support for details.'}`;
    
    console.log(`Email to ${updatedSeller.email}: ${emailMessage}`);
    
    res.json({ 
      message: `Campus verification ${status}`,
      auditLog: auditLog
    });
  } catch (error) {
    console.error('Review campus verification error:', error);
    res.status(500).json({ message: "Review failed", error: error.message });
  }
};

// Get reports
export const getReports = async (req, res) => {
  try {
    const reports = await prisma.userReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    const formattedReports = reports.map(report => ({
      id: report.id,
      reporterId: report.reporterId,
      reportedUserId: report.reportedUserId,
      reason: report.reason,
      status: report.status,
      priority: 'medium',
      type: report.reason?.includes('scam') ? 'scam' : 
             report.reason?.includes('harassment') ? 'harassment' :
             report.reason?.includes('fake') ? 'fake_product' :
             report.reason?.includes('inappropriate') ? 'inappropriate' :
             report.reason?.includes('safety') ? 'safety' : 'other',
      createdAt: report.createdAt,
      reporterEmail: 'user@example.com',
      reportedUserEmail: 'reported@example.com'
    }));
    
    res.json(formattedReports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

// Suspend user
export const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const user = await prisma.buyer.update({
      where: { id: parseInt(id) },
      data: { 
        isVerified: false
      }
    });
    
    console.log(`Admin suspended buyer #${id}: ${reason || 'No reason provided'}`);
    res.json({ message: "User suspended successfully" });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: "Failed to suspend user", error: error.message });
  }
};

// Suspend seller
export const suspendSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const seller = await prisma.seller.update({
      where: { id: parseInt(id) },
      data: { 
        isVerified: false
      }
    });
    
    console.log(`Admin suspended seller #${id}: ${reason || 'No reason provided'}`);
    res.json({ message: "Seller suspended successfully" });
  } catch (error) {
    console.error('Suspend seller error:', error);
    res.status(500).json({ message: "Failed to suspend seller", error: error.message });
  }
};

// Get user details
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    
    if (type === 'buyer' || req.path.includes('/users/')) {
      const user = await prisma.buyer.findUnique({
        where: { id: parseInt(id) },
        include: {
          orders: { take: 5, orderBy: { createdAt: 'desc' } },
          reviews: { take: 5, orderBy: { createdAt: 'desc' } },
          _count: { select: { orders: true, reviews: true, wishlist: true } }
        }
      });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } else {
      const seller = await prisma.seller.findUnique({
        where: { id: parseInt(id) },
        include: {
          products: { take: 5, orderBy: { createdAt: 'desc' } },
          orders: { take: 5, orderBy: { createdAt: 'desc' } },
          _count: { select: { products: true, orders: true, reviews: true } }
        }
      });
      if (!seller) return res.status(404).json({ message: "Seller not found" });
      res.json(seller);
    }
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
};

// Reset user password
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    
    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    
    if (type === 'buyer' || req.path.includes('/users/')) {
      await prisma.buyer.update({
        where: { id: parseInt(id) },
        data: { resetToken, resetTokenExpiry }
      });
    } else {
      await prisma.seller.update({
        where: { id: parseInt(id) },
        data: { resetToken, resetTokenExpiry }
      });
    }
    
    console.log(`Password reset initiated for ${type || 'user'} #${id}`);
    res.json({ message: "Password reset email sent", resetToken });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

// Send message to user
export const sendUserMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, message, title } = req.body;
    
    const notification = await prisma.notification.create({
      data: {
        title: title || 'Message from Admin',
        message,
        type: 'admin_message',
        buyerId: (type === 'buyer' || req.path.includes('/users/')) ? parseInt(id) : null,
        sellerId: (type === 'seller' || req.path.includes('/sellers/')) ? parseInt(id) : null
      }
    });
    
    console.log(`Admin sent message to ${type || 'user'} #${id}: ${message}`);
    res.json({ message: "Message sent successfully" });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// Broadcast message to all users
export const broadcastMessage = async (req, res) => {
  try {
    const { type, title, message } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }
    
    // Get all users
    const [buyers, sellers] = await Promise.all([
      prisma.buyer.findMany({ select: { id: true } }),
      prisma.seller.findMany({ select: { id: true } })
    ]);
    
    // Create notifications for all users
    const notifications = [];
    
    // Add notifications for buyers
    buyers.forEach(buyer => {
      notifications.push({
        title,
        message,
        type: `broadcast_${type}`,
        buyerId: buyer.id,
        sellerId: null
      });
    });
    
    // Add notifications for sellers
    sellers.forEach(seller => {
      notifications.push({
        title,
        message,
        type: `broadcast_${type}`,
        buyerId: null,
        sellerId: seller.id
      });
    });
    
    // Batch create all notifications
    await prisma.notification.createMany({
      data: notifications
    });
    
    const totalUsers = buyers.length + sellers.length;
    
    console.log(`Admin broadcast message sent to ${totalUsers} users: ${title}`);
    res.json({ 
      message: "Broadcast message sent successfully",
      totalUsers,
      totalBuyers: buyers.length,
      totalSellers: sellers.length
    });
  } catch (error) {
    console.error('Broadcast message error:', error);
    res.status(500).json({ message: "Failed to send broadcast message" });
  }
};

// Export users data
export const exportUsers = async (req, res) => {
  try {
    const [buyers, sellers] = await Promise.all([
      prisma.buyer.findMany({
        select: {
          id: true, name: true, email: true, number: true,
          isVerified: true, createdAt: true
        }
      }),
      prisma.seller.findMany({
        select: {
          id: true, name: true, email: true, phone: true,
          storeName: true, isVerified: true, createdAt: true
        }
      })
    ]);
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalBuyers: buyers.length,
      totalSellers: sellers.length,
      buyers,
      sellers
    };
    
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: "Failed to export users" });
  }
};

// Admin middleware
export const adminAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: "Not admin" });

    req.admin = decoded;
    req.user = decoded; // Add this for compatibility with student verification
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};