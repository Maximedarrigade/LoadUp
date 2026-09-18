import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createMeal,
  getMealsByDate,
  deleteMeal,
  addMealIngredient,
  removeMealIngredient,
} from "../controllers/meal.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", createMeal);
router.get("/", getMealsByDate);
router.delete("/:mealId", deleteMeal);
router.post("/:mealId/ingredients", addMealIngredient);
router.delete("/ingredients/:ingredientId", removeMealIngredient);

export default router;
