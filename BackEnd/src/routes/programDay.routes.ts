import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createProgramDay } from "../controllers/programDay.controller";

const router = Router();

router.use(authMiddleware);

router.post("/:programId/days", createProgramDay);

export default router;