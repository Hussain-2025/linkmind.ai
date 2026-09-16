import { Router } from "express";
import { getDashboardOverview, exportAnalyticsReport } from "../controllers/analyticsController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect as any);

router.get("/dashboard", getDashboardOverview as any);
router.get("/export", exportAnalyticsReport as any);

export default router;
