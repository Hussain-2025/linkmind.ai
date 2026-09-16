import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { AuthenticatedRequest, generateTokens, setAuthCookies, clearAuthCookies } from "../middleware/auth.js";
import { AuditLog } from "../models/AuditLog.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-linkmind-jwt-key-2026";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      res.status(400).json({ message: "Please enter all required domains: username, email, password" });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ message: "Username must be at least 3 characters long" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters long" });
      return;
    }

    // Check existing
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(409).json({ message: "An account with this email address already exists" });
      return;
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: email === "kamarthinaresh79@gmail.com" ? "admin" : "user", // Default is user, but developer gets admin
    });

    // Sign tokens
    const { accessToken, refreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    // Audit log
    await AuditLog.create({
      userId: user._id,
      action: "USER_REGISTER",
      details: `User registration success for email: ${email}`,
      ip: req.ip || "127.0.0.1",
    });

    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Internal server error during registration", error: err.message });
  }
}

// @desc    Login user & get tokens
// @route   POST /api/auth/login
// @access  Public
export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400).json({ message: "Please provide email and password details" });
      return;
    }

    // Find and select password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({ message: "Invalid credentials specified" });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({ message: "This account has been administratively suspended. Contact support." });
      return;
    }

    // Check password
    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials specified" });
      return;
    }

    if (user.email === "kamarthinaresh79@gmail.com" && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    // Generate cookies
    const { accessToken, refreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    // Audit log
    await AuditLog.create({
      userId: user._id,
      action: "USER_LOGIN",
      details: `User login successful from IP: ${req.ip || "127.0.0.1"}`,
      ip: req.ip || "127.0.0.1",
    });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error during session creation", error: err.message });
  }
}

// @desc    Logout user & clear cookies
// @route   POST /api/auth/logout
// @access  Public (Lenient Auth)
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    let resolvedUserId: string | null = null;

    // Best-effort lenient audit log identification
    if ((req as any).user) {
      resolvedUserId = (req as any).user.id;
    } else {
      let token = req.cookies?.accessToken;
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
      }
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded && decoded.id) {
            resolvedUserId = decoded.id;
          }
        } catch (jwtErr) {
          // Ignore token error during logout auditing
        }
      }
    }

    if (resolvedUserId) {
      await AuditLog.create({
        userId: resolvedUserId as any,
        action: "USER_LOGOUT",
        details: `Profile session terminated explicitly`,
        ip: req.ip || "127.0.0.1",
      });
    }

    clearAuthCookies(res);
    res.json({ message: "User session revoked successfully" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to explicitly logout", error: err.message });
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Protected
export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No active session detected" });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.email === "kamarthinaresh79@gmail.com" && user.role !== "admin") {
      user.role = "admin";
      await user.save();
      
      // Re-sign active authentication session credentials matching target admin role!
      const { accessToken, refreshToken } = generateTokens(user);
      setAuthCookies(res, accessToken, refreshToken);
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to obtain current credentials Profile", error: err.message });
  }
}

// @desc    Refresh session tokens
// @route   POST /api/auth/refresh
// @access  Public
export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  const tokenFromCookie = req.cookies?.refreshToken;
  const activeRefreshToken = refreshToken || tokenFromCookie;

  if (!activeRefreshToken) {
    res.status(401).json({ message: "Refresh token missing" });
    return;
  }

  try {
    const decoded = jwt.verify(activeRefreshToken, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ message: "User not found or suspended" });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({ message: "Your account has been suspended" });
      return;
    }

    const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens(user);
    setAuthCookies(res, newAccess, newRefresh);

    res.json({
      accessToken: newAccess,
      refreshToken: newRefresh,
    });
  } catch (err: any) {
    res.status(401).json({ message: "Refresh token invalid", error: err.message });
  }
}

