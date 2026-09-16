import { Router } from "express";
import {
  createLink,
  getLinks,
  updateLink,
  deleteLink,
  toggleFavorite,
  toggleArchive,
  getLinkStats,
  getLinkAIInsights,
} from "../controllers/linkController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect as any); // Protect all routes in this namespace

router.post("/", createLink as any);
router.get("/", getLinks as any);
router.put("/:id", updateLink as any);
router.delete("/:id", deleteLink as any);
router.patch("/:id/favorite", toggleFavorite as any);
router.patch("/:id/archive", toggleArchive as any);
router.get("/:id/stats", getLinkStats as any);
router.post("/:id/ai-insights", getLinkAIInsights as any);

export default router;
