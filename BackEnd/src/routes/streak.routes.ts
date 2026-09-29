import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getStreak } from "../controllers/streak.controller";
import { getWeekSummary } from "../controllers/weekSummary.controller";

const router = Router();

router.use(authMiddleware);

router.get("/streak", getStreak);
router.get("/week-summary", getWeekSummary);

export default router;
