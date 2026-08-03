import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createProgramExercise,
  updateProgramExercise,
  deleteProgramExercise,
} from "../controllers/programExercise.controller";

const router = Router();

router.use(authMiddleware);

router.post("/:dayId/exercises", createProgramExercise);
router.put("/exercises/:exerciseId", updateProgramExercise);
router.delete("/exercises/:exerciseId", deleteProgramExercise);

export default router;