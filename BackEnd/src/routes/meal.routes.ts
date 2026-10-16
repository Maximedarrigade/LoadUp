import express, { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createMeal,
  getMealsByDate,
  deleteMeal,
  addMealIngredient,
  removeMealIngredient,
} from "../controllers/meal.controller";
import {
  analyzeMealPhotoHandler,
  photoUploadErrorHandler,
  MAX_PHOTO_BYTES,
} from "../controllers/photoAnalysis.controller";
import { photoRateLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", createMeal);
// Raw JPEG body kept in memory only (never written to disk), size-capped before parsing.
router.post(
  "/photo-analysis",
  photoRateLimiter,
  express.raw({ type: "image/jpeg", limit: MAX_PHOTO_BYTES }),
  analyzeMealPhotoHandler,
  photoUploadErrorHandler
);
router.get("/", getMealsByDate);
router.delete("/:mealId", deleteMeal);
router.post("/:mealId/ingredients", addMealIngredient);
router.delete("/ingredients/:ingredientId", removeMealIngredient);

export default router;
