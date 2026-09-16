import { Router } from "express";
import {
  getAdminStats,
  getUsers,
  toggleSuspendUser,
  getPlatformLinks,
  moderateDeleteLink,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// Elevate protection: Require standard authenticated user AND check role = 'admin'
router.use(protect as any, authorize("admin") as any);

router.get("/stats", getAdminStats as any);
router.get("/users", getUsers as any);
router.patch("/users/:id/suspend", toggleSuspendUser as any);
router.get("/links", getPlatformLinks as any);
router.delete("/links/:id", moderateDeleteLink as any);

export default router;
