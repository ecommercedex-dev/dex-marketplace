// routes/product.routes.js
import express from "express";
import { verifyToken, restrictTo } from "../middleware/authMiddleware.js";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  deployProduct,
  getAllDeployedProducts,
  undeployProduct,
  getProductsBySellerId,

  // HOSTEL BOOKING SYSTEM
  bookHostel,
  getMyBookings,
  getIncomingBookings,
  manageBooking,
} from "../controllers/productController.js";

import multer from "multer";
import path from "path";
import prisma from "../lib/prisma.js";

const router = express.Router();

// ================= MULTER FILE STORAGE =================
const storage = multer.diskStorage({
  destination: "./uploads/products/",
  filename: (req, file, cb) => {
    const sanitizedName = path.basename(file.originalname);
    cb(null, `${Date.now()}_${path.extname(sanitizedName)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error("Only images allowed (jpeg, jpg, png, webp)"));
  },
});

// ================= CORRECT ROUTE ORDER — DO NOT CHANGE =================

// 1. EXACT STATIC ROUTES FIRST (these must come before any :id or /)
router.get("/my", verifyToken, restrictTo("seller"), getProducts); // ← FIXED: Now first!
router.get("/by-seller", getProductsBySellerId);
router.get("/category/all", getAllDeployedProducts);

// 2. Root route with query handling
router.get("/", async (req, res) => {
  if (req.query.sellerId) {
    return getProductsBySellerId(req, res);
  }
  return getAllDeployedProducts(req, res);
});

// ================= BULK ACTIONS (MUST BE BEFORE ANY /:id ROUTES) =================
router.post("/bulk/deploy", verifyToken, restrictTo("seller"), (req, res, next) => {
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
}, async (req, res) => {
  const { ids } = req.body;
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty ids array' });
    }
    const productIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (productIds.length === 0) {
      return res.status(400).json({ error: 'No valid product IDs provided' });
    }
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds }, sellerId: req.user.id },
      data: { deployed: true }
    });
    res.json({ message: `${result.count} products deployed` });
  } catch (err) {
    console.error('Bulk deploy error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/bulk/undeploy", verifyToken, restrictTo("seller"), (req, res, next) => {
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
}, async (req, res) => {
  const { ids } = req.body;
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty ids array' });
    }
    const productIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (productIds.length === 0) {
      return res.status(400).json({ error: 'No valid product IDs provided' });
    }
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds }, sellerId: req.user.id },
      data: { deployed: false }
    });
    res.json({ message: `${result.count} products removed from shop` });
  } catch (err) {
    console.error('Bulk undeploy error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk Update Stock Status
router.post("/bulk/updateStock", verifyToken, restrictTo("seller"), (req, res, next) => {
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
}, async (req, res) => {
  const { ids, stockStatus } = req.body;
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty ids array' });
    }
    const productIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (productIds.length === 0) {
      return res.status(400).json({ error: 'No valid product IDs provided' });
    }
    
    // Update stock based on status
    let stockValue = stockStatus === 'out-of-stock' ? 0 : stockStatus === 'low-stock' ? 5 : null;
    const updateData = stockValue !== null ? { stock: stockValue } : {};
    
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds }, sellerId: req.user.id },
      data: updateData
    });
    res.json({ message: `${result.count} products updated`, stockStatus });
  } catch (err) {
    console.error('Bulk stock update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk Update Condition
router.post("/bulk/updateCondition", verifyToken, restrictTo("seller"), (req, res, next) => {
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
}, async (req, res) => {
  const { ids, condition } = req.body;
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty ids array' });
    }
    const productIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (productIds.length === 0) {
      return res.status(400).json({ error: 'No valid product IDs provided' });
    }
    
    // Get products and update their details JSON
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, sellerId: req.user.id }
    });
    
    await Promise.all(products.map(async (product) => {
      const details = typeof product.details === 'string' ? JSON.parse(product.details || '{}') : product.details || {};
      details.Condition = condition;
      
      await prisma.product.update({
        where: { id: product.id },
        data: { details: JSON.stringify(details) }
      });
    }));
    
    res.json({ message: `${products.length} products updated`, condition });
  } catch (err) {
    console.error('Bulk condition update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk Add Safety Notes
router.post("/bulk/addSafety", verifyToken, restrictTo("seller"), (req, res, next) => {
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
}, async (req, res) => {
  const { ids, safetyNotes } = req.body;
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty ids array' });
    }
    const productIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (productIds.length === 0) {
      return res.status(400).json({ error: 'No valid product IDs provided' });
    }
    
    // Append safety notes to description
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, sellerId: req.user.id }
    });
    
    await Promise.all(products.map(async (product) => {
      const currentDesc = product.description || '';
      const safetySection = `\n\n⚠️ SAFETY NOTES:\n${safetyNotes}`;
      const newDesc = currentDesc.includes('⚠️ SAFETY NOTES:') 
        ? currentDesc.replace(/⚠️ SAFETY NOTES:[\s\S]*$/, safetySection.trim())
        : currentDesc + safetySection;
      
      await prisma.product.update({
        where: { id: product.id },
        data: { description: newDesc }
      });
    }));
    
    res.json({ message: `Safety notes added to ${products.length} products` });
  } catch (err) {
    console.error('Bulk safety notes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. DYNAMIC PARAM ROUTE — DEAD LAST (so it doesn't catch /my)
router.get("/:id", verifyToken, getProduct); // ← Now safe!

// ================= PRODUCT CRUD =================
router.post(
  "/add",
  verifyToken,
  restrictTo("seller"),
  upload.array("images", 10),
  createProduct
);

router.post(
  "/hostel/add",
  verifyToken,
  restrictTo("seller"),
  upload.array("images", 10),
  createProduct
);

router.put(
  "/:id",
  verifyToken,
  restrictTo("seller"),
  upload.array("images", 10),
  updateProduct
);

router.put(
  "/hostel/:id",
  verifyToken,
  restrictTo("seller"),
  upload.array("images", 10),
  updateProduct
);

// ================= SINGLE PRODUCT ACTIONS =================
router.patch("/:id/deploy", verifyToken, restrictTo("seller"), async (req, res) => {
  try {
    const { deployed } = req.body;
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id), sellerId: req.user.id },
      data: { deployed }
    });
    res.json({ message: deployed ? 'Product deployed' : 'Product hidden', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/:id/deploy", verifyToken, restrictTo("seller"), deployProduct);
router.post("/:id/undeploy", verifyToken, restrictTo("seller"), undeployProduct);
router.delete("/:id", verifyToken, restrictTo("seller"), deleteProduct);

// ================= HOSTEL TENANT MANAGEMENT =================
router.get("/hostel/tenants", verifyToken, restrictTo("seller"), async (req, res) => {
  try {
    const tenants = await prisma.hostelTenant.findMany({ where: { sellerId: req.user.id } });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/hostel/tenants", verifyToken, restrictTo("seller"), (req, res, next) => {
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
}, async (req, res) => {
  try {
    const tenant = await prisma.hostelTenant.create({
      data: { ...req.body, sellerId: req.user.id }
    });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/hostel/tenants/:id/toggle-payment", verifyToken, restrictTo("seller"), (req, res, next) => {
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
}, async (req, res) => {
  try {
    const tenant = await prisma.hostelTenant.findUnique({ where: { id: req.params.id } });
    await prisma.hostelTenant.update({
      where: { id: req.params.id },
      data: { paymentStatus: tenant.paymentStatus === 'paid' ? 'unpaid' : 'paid' }
    });
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/hostel/tenants/:id", verifyToken, restrictTo("seller"), async (req, res) => {
  try {
    await prisma.hostelTenant.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= HOSTEL BOOKING SYSTEM =================
router.post("/hostel/book/:id", verifyToken, restrictTo("buyer"), (req, res, next) => {
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
}, bookHostel);
router.get(
  "/hostel/my-bookings",
  verifyToken,
  restrictTo("buyer"),
  getMyBookings
);
router.get(
  "/hostel/incoming-bookings",
  verifyToken,
  restrictTo("seller"),
  getIncomingBookings
);
router.post(
  "/hostel/manage-booking",
  verifyToken,
  restrictTo("seller"),
  (req, res, next) => {
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
      return res.status(400).json({ error: 'Content-Type must be application/json' });
    }
    next();
  },
  manageBooking
);

export default router;
