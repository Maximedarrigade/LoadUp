import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  listWorkoutTemplates,
  applySessionTemplate,
  applyProgramTemplate,
} from "../controllers/workoutTemplate.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", listWorkoutTemplates);
router.post("/sessions/:templateId/apply", applySessionTemplate);
router.post("/programs/:templateId/apply", applyProgramTemplate);

export default router;
