import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getStreak } from "../controllers/streak.controller";

const router = Router();

router.use(authMiddleware);

router.get("/streak", getStreak);

export default router;
