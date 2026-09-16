import { Router } from "express";
import {
  createCampaign,
  getCampaigns,
  deleteCampaign,
  getCampaignStats,
} from "../controllers/campaignController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect as any);

router.post("/", createCampaign as any);
router.get("/", getCampaigns as any);
router.delete("/:id", deleteCampaign as any);
router.get("/:id/stats", getCampaignStats as any);

export default router;
