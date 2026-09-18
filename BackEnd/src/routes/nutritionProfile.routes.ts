import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getNutritionProfile, upsertNutritionProfile } from "../controllers/nutritionProfile.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getNutritionProfile);
router.put("/", upsertNutritionProfile);

export default router;
