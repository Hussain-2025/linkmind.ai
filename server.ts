import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { connectDB } from "./server/config/db.js";
import { initSockets } from "./server/sockets.js";

// Enterprise Services and Security Bootstraps
import { initQueueSystem } from "./server/services/queueService.js";
import { initCronJobs } from "./server/services/cronService.js";
import { csrfProtection } from "./server/middleware/csrf.js";
import {
  globalRateLimiter,
  authRateLimiter,
  redirectRateLimiter,
} from "./server/middleware/rateLimiter.js";

// Routes
import authRoutes from "./server/routes/authRoutes.js";
import linkRoutes from "./server/routes/linkRoutes.js";
import campaignRoutes from "./server/routes/campaignRoutes.js";
import analyticsRoutes from "./server/routes/analyticsRoutes.js";
import adminRoutes from "./server/routes/adminRoutes.js";
import redirectRoutes from "./server/routes/redirectRoutes.js";
import apiKeyRoutes from "./server/routes/apiKeyRoutes.js";

async function startServer() {
  const app = express();
  app.set("trust proxy", true);
  const server = http.createServer(app);
  const PORT = 3000;

  // Global DDoS Rate Limiter Protection
  app.use(globalRateLimiter);

  // Middlewares
  app.use(
    cors({
      origin: true, // Allow AI Studio iframe origins dynamically
      credentials: true,
    })
  );

  // Configure Helmet securely, ensuring inline styles are allowed for Tailwind inline styling & animations
  app.use(
    helmet({
      contentSecurityPolicy: false, // Turn off CSP temporarily to avoid framing issue in the developer sandbox iframe
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Connect database
  await connectDB();

  // Initialize background systems
  initQueueSystem();
  initCronJobs();

  // Initialize Socket.IO
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

  // Serve Frontend with Vite Middleware in Dev, or static artifacts in Production
  if (process.env.NODE_ENV !== "production") {
    console.log("Enabling active Vite Development asset loaders...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving compiled static assets from dist folder...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`LinkMind AI fully running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server failure during initialization:", err);
});
