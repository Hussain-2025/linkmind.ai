import { Router } from "express";
import { register, login, logout, getProfile, refresh } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", authRateLimiter as any, register as any);
router.post("/login", authRateLimiter as any, login as any);
router.post("/refresh", refresh as any);
router.post("/logout", logout as any);
router.get("/profile", protect as any, getProfile as any);

export default router;
