import { z } from "zod";
import { safeText, safeTextOptional } from "./common.validator";

export const createMealSchema = z.object({
  name: safeTextOptional(100, "Le nom du repas"),
  date: z.string().max(50).optional().nullable(),
});

export const mealIngredientSchema = z.object({
  name: safeText(1, 150, "Le nom de l'ingrédient"),
  weightInGrams: z.number().positive("Le poids doit être positif."),
  caloriesPer100g: z.number().nonnegative("Les calories doivent être positives ou nulles."),
  proteinPer100g: z.number().nonnegative("Les protéines doivent être positives ou nulles."),
  carbsPer100g: z.number().nonnegative("Les glucides doivent être positifs ou nuls.").optional().nullable(),
  fatPer100g: z.number().nonnegative("Les lipides doivent être positifs ou nuls.").optional().nullable(),
  openFoodFactsId: z.string().max(100).optional().nullable(),
});
