import express from "express";
import {
  adminLogin,
  adminAuth,
  ipWhitelist,
  getStats,
  getUsers,
  getSellers,
  getProducts,
  getOrders,
  getReports,
  deleteUser,
  deleteSeller,
  deleteProduct,
  toggleProductStatus,
  getCampusVerifications,
  reviewCampusVerification,
  suspendUser,
  suspendSeller,
  getUserDetails,
  resetUserPassword,
  sendUserMessage,
  broadcastMessage,
  exportUsers
} from "../controllers/adminController.js";
import {
  getPendingVerifications,
  reviewVerification
} from "../controllers/studentVerificationController.js";

const router = express.Router();

// Public routes with IP restriction
router.post("/login", ipWhitelist, adminLogin);

// Protected admin routes
router.use(ipWhitelist); // IP whitelist for all admin routes
router.use(adminAuth); // All routes below require admin auth

// Dashboard stats
router.get("/stats", getStats);

// User management
router.get("/users", getUsers);
router.get("/users/export", exportUsers);
router.post("/broadcast-message", broadcastMessage);
router.get("/users/:id", getUserDetails);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/suspend", suspendUser);
router.post("/users/:id/reset-password", resetUserPassword);
router.post("/users/:id/message", sendUserMessage);

// Seller management
router.get("/sellers", getSellers);
router.get("/sellers/:id", getUserDetails);
router.delete("/sellers/:id", deleteSeller);
router.patch("/sellers/:id/suspend", suspendSeller);

// Product management
router.get("/products", getProducts);
router.delete("/products/:id", deleteProduct);
router.patch("/products/:id/toggle", toggleProductStatus);

// Order management
router.get("/orders", getOrders);

// Student verifications
router.get("/student-verifications", getPendingVerifications);
router.post("/student-verifications/:id/review", reviewVerification);

// Campus verifications
router.get("/campus-verifications", getCampusVerifications);
router.post("/campus-verifications/:id/review", reviewCampusVerification);

// Reports
router.get("/reports", getReports);

export default router;