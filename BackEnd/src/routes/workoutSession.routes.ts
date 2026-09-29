import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  startSession,
  getCurrentSession,
  saveWorkoutSet,
  finishSession,
} from "../controllers/workoutSession.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", startSession);
router.get("/current", getCurrentSession);
router.post("/:sessionId/sets", saveWorkoutSet);
router.post("/:sessionId/finish", finishSession);

export default router;
