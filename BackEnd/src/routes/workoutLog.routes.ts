import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createWorkoutLog, getWorkoutLogs } from "../controllers/workoutLog.controller";

const router = Router();

router.use(authMiddleware);

router.post("/:exerciseId/logs", createWorkoutLog);
router.get("/:exerciseId/logs", getWorkoutLogs);

export default router;