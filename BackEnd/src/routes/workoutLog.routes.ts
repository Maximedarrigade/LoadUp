import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createWorkoutLog, getWorkoutLogs, getExerciseHistory } from "../controllers/workoutLog.controller";

const router = Router();

router.use(authMiddleware);

router.post("/:exerciseId/logs", createWorkoutLog);
router.get("/:exerciseId/logs", getWorkoutLogs);
router.get("/:exerciseId/history", getExerciseHistory);

export default router;