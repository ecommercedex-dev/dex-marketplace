import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { WebSocketServer } from "ws";
import compression from "compression";
import { config } from "./config/config.js";
import { securityHeaders, corsOptions } from "./middleware/securityMiddleware.js";
import { apiLimiter } from "./middleware/rateLimitMiddleware.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";

// Routes
import buyerAuthRoutes from "./routes/buyerauth.js";
import sellerAuthRoutes from "./routes/sellerauth.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";
import buyerProfileRoutes from "./routes/buyerProfile.js";
import sellerProfileRoutes from "./routes/sellerProfile.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import recentlyViewedRoutes from "./routes/recentlyViewedRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import sellerReviewRoutes from "./routes/sellerReviewRoutes.js";
import shopSettingsRoutes from "./routes/shopSettings.js";
import sellerFollowRoutes from "./routes/sellerFollowRoutes.js";
import homeRoutes from "./routes/homeRoutes.js";
import adminRoutes from "./routes/admin.js";
import studentVerificationRoutes from "./routes/studentVerification.js";
import sellerVerificationRoutes from "./routes/verificationRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Production security and HTTPS
if (config.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// Security & Performance Middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(compression());
app.use(apiLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Serve uploads with CORS headers
app.use("/uploads", (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.resolve(__dirname, "uploads")));

// Serve frontend
app.use(express.static(path.resolve(__dirname, "../DEX_FRONTEND")));

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../DEX_FRONTEND/Dex-home.html"));
});

// Routes
app.use("/api/buyers", buyerAuthRoutes);
app.use("/api", sellerAuthRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/buyers/profile", buyerProfileRoutes);
app.use("/api/seller/profile", sellerProfileRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/recently-viewed", recentlyViewedRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api", sellerReviewRoutes);
app.use("/api/shop", shopSettingsRoutes);
app.use("/api/seller", sellerFollowRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/buyers", studentVerificationRoutes);
app.use("/api/seller/verification", sellerVerificationRoutes);
app.use(
  "/static",
  express.static(
    path.resolve(__dirname, "../DEX_FRONTEND/DEX_HOMEPAGES/PROFILE_PAGES/default_account_picture")
  )
);

// Health check
app.get("/health", async (req, res) => {
  try {
    const { healthCheck } = await import('./health-monitor.js');
    const health = await healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});



// -------------------- SERVER & WEBSOCKET --------------------
const server = http.createServer(app); // wrap express server

// WebSocket server
export const wss = new WebSocketServer({ server });

// Store connected clients (sellerId -> ws)
export const clients = new Map();

wss.on("connection", (ws, req) => {
  const params = new URLSearchParams(req.url.replace("/?", ""));
  const userId = params.get("userId");
  if (!userId) return;

  clients.set(userId, ws);

  ws.on("close", () => clients.delete(userId));
});

// Helper to push notification to a specific seller
export const pushNotification = (sellerId, notification) => {
  const ws = clients.get(sellerId);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(notification));
  }
};

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.PORT;
server.listen(PORT, () => {
  logger.info(`🚀 DEX Server running on port ${PORT} in ${config.NODE_ENV} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
