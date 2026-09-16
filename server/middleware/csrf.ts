import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS", "TRACE"];

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // 1. Bypass CSRF validation for programmatic Developer API keys or any Bearer/Token headers (immune to CSRF)
  const isHeaderAuthenticated = !!(req.headers["x-api-key"] || 
                                  req.headers["authorization"]?.toString().startsWith("Bearer ") ||
                                  req.headers["x-refresh-token"]);
  if (isHeaderAuthenticated) {
    return next();
  }

  // 2. Bypass CSRF checking for onboarding auth endpoints (no active credentials session to compromise yet)
  const pathStr = req.path || "";
  const origUrl = req.originalUrl || "";
  const isAuthOrRedirect = pathStr.startsWith("/auth/") || 
                           origUrl.includes("/auth/") ||
                           pathStr.startsWith("/r/") ||
                           origUrl.includes("/r/");
  if (isAuthOrRedirect) {
    return next();
  }

  // 2. Generate token on every request if it does not exist in cookies
  let csrfToken = req.cookies["XSRF-TOKEN"];
  if (!csrfToken) {
    csrfToken = crypto.randomBytes(32).toString("hex");
    const isProd = process.env.NODE_ENV === "production";
    // Secure cookie setup, none sameSite for iframe compatibility in production, httpOnly false is essential so Axios can read it natively
    res.cookie("XSRF-TOKEN", csrfToken, {
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      httpOnly: false, // Must be readable by axios to support automatic XSRF headers
      path: "/",
    });
  }

  // 2. Bypass verification step for safe read-only methods
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  // 3. Double-Submit validation check on mutative methods
  // Axios sends the cookie value back in standard 'X-XSRF-TOKEN' or 'x-xsrf-token' headers
  const headerToken = req.headers["x-xsrf-token"] || req.headers["x-csrf-token"];

  if (!csrfToken || !headerToken || csrfToken !== headerToken) {
    console.warn(`[CSRF Security Blocked] Request method: ${req.method}. Header token: ${headerToken ? "Provided" : "Missing"}. Cookie token: ${csrfToken ? "Provided" : "Missing"}`);
    res.status(403).json({
      message: "CSRF token validation failed. Unauthorized cross-site requests prevented.",
    });
    return;
  }

  next();
}
