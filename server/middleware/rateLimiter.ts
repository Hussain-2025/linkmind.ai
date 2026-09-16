import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

// Global general website buffer
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 5000 : 200, // Generous limit in dev (Vite HMR generates many requests), strict in production
  message: {
    message: "Too many requests from this IP address context. Please retry in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skip: (req) => {
    // In development, skip rate limiting completely to avoid blocking local testing
    if (isDev) {
      return true;
    }
    return false;
  },
});

// Auth Limiters: secure login & registers from brute forcing
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 15, // 15 login / register trials inside 15 minutes
  message: {
    message: "Multiple authentication access trials received. Please secure your details and retry in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skip: (req) => isDev,
});

// AI Limiters: safeguard Gemini API tokens consumption
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 AI operations inside 15 minutes
  message: {
    message: "AI resource generation bounds reached. Please retry in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skip: (req) => isDev,
});

// Redirect Limits: control click spam attempts
export const redirectRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // Up to 300 redirection events in 15 minutes
  message: "Rate limit reached for redirects.",
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skip: (req) => isDev,
});

// Admin Limits: protect moderation and users modifications
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Max 30 commands within 15 minutes
  message: {
    message: "Admin action threshold reached.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skip: (req) => isDev,
});
