import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createProgramExercise,
  updateProgramExercise,
  deleteProgramExercise,
  reorderProgramExercises,
} from "../controllers/programExercise.controller";

const router = Router();

router.use(authMiddleware);

router.post("/:dayId/exercises", createProgramExercise);
router.put("/:dayId/exercises/reorder", reorderProgramExercises);
router.put("/exercises/:exerciseId", updateProgramExercise);
router.delete("/exercises/:exerciseId", deleteProgramExercise);

export default router;

