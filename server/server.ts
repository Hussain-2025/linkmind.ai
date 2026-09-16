import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";
import { initSockets } from "./sockets.js";

// Enterprise Services and Security Bootstraps
import { initQueueSystem } from "./services/queueService.js";
import { initCronJobs } from "./services/cronService.js";
import { csrfProtection } from "./middleware/csrf.js";
import {
  globalRateLimiter,
  redirectRateLimiter,
} from "./middleware/rateLimiter.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import linkRoutes from "./routes/linkRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import redirectRoutes from "./routes/redirectRoutes.js";
import apiKeyRoutes from "./routes/apiKeyRoutes.js";
import { Link } from "./models/Link.js";

async function startServer() {
  const app = express();
  app.set("trust proxy", true);
  const server = http.createServer(app);
  const PORT = process.env.PORT || 5000;

  // Global DDoS Rate Limiter Protection
  app.use(globalRateLimiter);

  // Cross-Origin Resource Sharing (CORS)
  const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5000",
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    })
  );

  // Configure Helmet securely
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize DB Connection
  await connectDB();

  // Initialize Distributed BullMQ System
  await initQueueSystem();

  // Initialize High-Availability Cron Schedulers
  initCronJobs();

  // Initialize Realtime Socket.IO cluster telemetry
  initSockets(server);

  // Apply CSRF Protection to all mutative /api state interfaces
  app.use("/api", csrfProtection);

  // Setup APIs with micro-throttling
  app.use("/api/auth", authRoutes);
  app.use("/api/keys", apiKeyRoutes);
  app.use("/api/links", linkRoutes);
  app.use("/api/campaigns", campaignRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/admin", adminRoutes);

  // Setup Redirects with click anti-spam protection
  app.use("/r", redirectRateLimiter, redirectRoutes);

  // Direct root shortlink redirects: /:code (e.g. domain.com/XOtDjO)
  const reservedFrontendRoutes = new Set([
    "login", "dashboard", "links", "campaigns", "admin", "unlock", "api", "r", "assets", "favicon.svg", "index.html"
  ]);
  app.get("/:code", async (req, res, next) => {
    const { code } = req.params;
    if (!code || reservedFrontendRoutes.has(code.toLowerCase())) {
      return next();
    }
    try {
      const link = await Link.findOne({ $or: [{ shortCode: code }, { customAlias: code }] });
      if (link) {
        return res.redirect(`/r/${code}`);
      }
    } catch {}
    next();
  });

  // Root status endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Serve static assets if client build exists, otherwise provide backend info
  const candidateDistPaths = [
    path.resolve(process.cwd(), "client/dist"),
    path.resolve(process.cwd(), "../client/dist"),
    path.resolve(__dirname, "../../client/dist"),
    path.resolve(process.cwd(), "dist/client"),
    path.resolve(process.cwd(), "dist"),
  ];
  const clientDistPath = candidateDistPaths.find((p) => fs.existsSync(path.join(p, "index.html")));

  if (clientDistPath) {
    console.log(`Serving compiled client assets from: ${clientDistPath}`);
    app.use(express.static(clientDistPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  } else {
    app.get("/", (req, res) => {
      res.json({
        name: "LinkMind AI API Server",
        version: "1.0.0",
        status: "running",
        docs: "/api",
      });
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`LinkMind AI Server fully running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server failure during initialization:", err);
});
