import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { config } from "../config/config.js";
import logger from "../utils/logger.js";

const prisma = new PrismaClient();

/**
 * Main authentication middleware
 * Supports: Bearer token in header OR token in cookie
 * Attaches FULL user object (buyer or seller) based on JWT
 */
export const verifyToken = async (req, res, next) => {
  try {
    // 1. Get token from cookie or Authorization header
    const token =
      req.cookies?.token ||
      req.header("Authorization")?.replace("Bearer ", "")?.trim();

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    // 2. Verify JWT
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const { id, role } = decoded;

    if (!role) {
      return res.status(401).json({ message: "Invalid token: missing role." });
    }

    let user;

    // 3. Fetch user from correct table based on role
    if (role === "buyer") {
      user = await prisma.buyer.findUnique({
        where: { id },
        select: {
          id: true,
          role: true,
          name: true,
          email: true,
          number: true,
          address: true,
          profilePic: true,
          index_num: true,
        },
      });
    } else if (role === "seller") {
      user = await prisma.seller.findUnique({
        where: { id },
        select: {
          id: true,
          role: true,
          name: true,
          email: true,
          storeName: true,
          phone: true,
          profilePic: true,
        },
      });
    } else {
      return res.status(401).json({ message: "Invalid role in token." });
    }

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    // 4. Attach full user to request
    req.user = user;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res
      .status(401)
      .json({ message: "Invalid or expired token. Please log in again." });
  }
};

/**
 * Role-based access control
 * Usage: router.get("/seller/...", verifyToken, restrictTo("seller"), handler)
 */
export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access forbidden: You do not have the required role.",
      });
    }

    next();
  };
};
