import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  listExerciseLibrary,
  getExerciseLibraryBodyParts,
  getExerciseLibraryById,
} from "../controllers/exerciseLibrary.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", listExerciseLibrary);
router.get("/bodyparts", getExerciseLibraryBodyParts);
router.get("/:id", getExerciseLibraryById);

export default router;
