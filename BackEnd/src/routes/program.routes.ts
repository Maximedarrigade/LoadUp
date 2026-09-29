import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
  reorderPrograms,
} from "../controllers/program.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", createProgram);
router.get("/", getPrograms);
// Déclarée avant "/:id" pour ne pas être capturée par la route paramétrée.
router.put("/reorder", reorderPrograms);
router.get("/:id", getProgramById);
router.put("/:id", updateProgram);
router.delete("/:id", deleteProgram);

export default router;