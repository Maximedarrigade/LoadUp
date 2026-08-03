import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createProgramExercise } from "../controllers/programExercise.controller";

const router = Router();

router.use(authMiddleware);

router.post("/:dayId/exercises", createProgramExercise);

export default router;