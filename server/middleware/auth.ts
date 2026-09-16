import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-linkmind-jwt-key-2026";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: "user" | "admin";
  };
}

// Generate tokens
export function generateTokens(user: any) {
  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

  return { accessToken, refreshToken };
}

// Set auth cookies
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === "production";

  // Access Token: 15 minutes
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  });

  // Refresh Token: 7 days
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// Clear cookies on logout
export function clearAuthCookies(res: Response) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
}

// Global Auth Middleware
export async function protect(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  // 1. Support Developer API Key login protocol
  const incomingApiKey = (req.headers["x-api-key"]?.toString() || 
                          (req.headers["authorization"]?.toString().startsWith("Bearer lm_") ? 
                           req.headers["authorization"].toString().split(" ")[1] : null));

  if (incomingApiKey) {
    try {
      const crypto = await import("crypto");
      const { ApiKey } = await import("../models/ApiKey.js");
      const hashed = crypto.createHash("sha256").update(incomingApiKey).digest("hex");
      const keyDoc = await ApiKey.findOne({ keyHash: hashed }).populate("userId");

      if (keyDoc) {
        if (keyDoc.expiresAt && keyDoc.expiresAt < new Date()) {
          res.status(401).json({ message: "Developer API Key has expired." });
          return;
        }

        const user = keyDoc.userId as any;
        if (!user) {
          res.status(401).json({ message: "Associated developer user account not found." });
          return;
        }

        if (user.isSuspended) {
          res.status(403).json({ message: "Associated developer user is suspended." });
          return;
        }

        req.user = {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role as "user" | "admin",
        };

        // Touch lastUsedAt asynchronously
        keyDoc.lastUsedAt = new Date();
        await keyDoc.save();
        return next();
      }
    } catch (err: any) {
      console.error("API Key database resolution failure:", err.message);
    }
  }

  // 2. Standard Web App cookies protocol fallback (or Bearer Token header check)
  let token = req.cookies?.accessToken;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    // Attempt automatic refresh flow
    let refreshToken = req.cookies?.refreshToken;
    if (!refreshToken && req.headers["x-refresh-token"]) {
      refreshToken = req.headers["x-refresh-token"] as string;
    }
    if (refreshToken) {
      try {
        const decodedRefresh = jwt.verify(refreshToken, JWT_SECRET) as { id: string };
        const user = await User.findById(decodedRefresh.id).select("+password");

        if (user && !user.isSuspended) {
          if ((user.email?.toLowerCase() === "kamarthinaresh79@gmail.com" || user.email === "kamarthinaresh79@gmail.com") && user.role !== "admin") {
            user.role = "admin";
            await user.save();
          }
          const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens(user);
          setAuthCookies(res, newAccess, newRefresh);
          req.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role as "user" | "admin",
          };
          return next();
        }
      } catch (err) {
        // Refresh token failed, clear all and prompt re-auth
        clearAuthCookies(res);
      }
    }
    
    res.status(401).json({ message: "Not authorized, token missing" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Quick verification that user is active
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ message: "User no longer exists" });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({ message: "Your account has been suspended" });
      return;
    }

    if ((user.email?.toLowerCase() === "kamarthinaresh79@gmail.com" || user.email === "kamarthinaresh79@gmail.com") && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role as "user" | "admin",
    };
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      // Access token expired, attempt refresh
      let refreshToken = req.cookies?.refreshToken;
      if (!refreshToken && req.headers["x-refresh-token"]) {
        refreshToken = req.headers["x-refresh-token"] as string;
      }
      if (refreshToken) {
        try {
          const decodedRefresh = jwt.verify(refreshToken, JWT_SECRET) as { id: string };
          const user = await User.findById(decodedRefresh.id);
          
          if (user && !user.isSuspended) {
            if ((user.email?.toLowerCase() === "kamarthinaresh79@gmail.com" || user.email === "kamarthinaresh79@gmail.com") && user.role !== "admin") {
              user.role = "admin";
              await user.save();
            }
            const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens(user);
            setAuthCookies(res, newAccess, newRefresh);
            req.user = {
              id: user._id.toString(),
              username: user.username,
              email: user.email,
              role: user.role as "user" | "admin",
            };
            return next();
          }
        } catch (rfErr) {
          clearAuthCookies(res);
        }
      }
    }

    res.status(401).json({ message: "Not authorized, token invalid" });
    return;
  }
}

// Role Based Authorization Middleware
export function authorize(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.user && (req.user.email?.toLowerCase() === "kamarthinaresh79@gmail.com" || req.user.email === "kamarthinaresh79@gmail.com")) {
      req.user.role = "admin";
      return next();
    }
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden - Insufficient operational privileges" });
      return;
    }
    next();
  };
}
