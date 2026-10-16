import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { computeNutritionTargets, NutritionProfileInput } from "../lib/nutrition";
import { createMealSchema, mealIngredientSchema } from "../validators/meal.validator";

type IngredientNutrients = {
  weightInGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number | null;
  fatPer100g: number | null;
};

// Ingredients saved before carbs/fat were tracked have null values and count as 0 g.
function ingredientTotals(ingredient: IngredientNutrients) {
  const factor = ingredient.weightInGrams / 100;
  return {
    calories: ingredient.caloriesPer100g * factor,
    protein: ingredient.proteinPer100g * factor,
    carbs: (ingredient.carbsPer100g ?? 0) * factor,
    fat: (ingredient.fatPer100g ?? 0) * factor,
  };
}

function mealWithTotals(meal: { ingredients: IngredientNutrients[] } & Record<string, any>) {
  const totals = meal.ingredients.reduce(
    (acc, ingredient) => {
      const t = ingredientTotals(ingredient);
      return {
        calories: acc.calories + t.calories,
        protein: acc.protein + t.protein,
        carbs: acc.carbs + t.carbs,
        fat: acc.fat + t.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    ...meal,
    totalCalories: Math.round(totals.calories),
    totalProtein: Math.round(totals.protein),
    totalCarbs: Math.round(totals.carbs),
    totalFat: Math.round(totals.fat),
  };
}

function dayRange(dateParam: unknown) {
  const base = typeof dateParam === "string" && dateParam ? new Date(dateParam) : new Date();
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function createMeal(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const parseResult = createMealSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { name, date } = parseResult.data;

    const meal = await prisma.meal.create({
      data: {
        name: name || `Repas du ${new Date().toLocaleDateString("fr-FR")}`,
        date: date ? new Date(date) : undefined,
        userId,
      },
      include: { ingredients: true },
    });

    res.status(201).json(mealWithTotals(meal));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la création du repas." });
  }
}

export async function getMealsByDate(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const { start, end } = dayRange(req.query.date);

    const [meals, profile] = await Promise.all([
      prisma.meal.findMany({
        where: { userId, date: { gte: start, lt: end } },
        include: { ingredients: true },
        orderBy: { date: "asc" },
      }),
      prisma.nutritionProfile.findUnique({ where: { userId } }),
    ]);

    const mealsWithTotals = meals.map(mealWithTotals);
    const dayTotals = mealsWithTotals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + meal.totalProtein,
        carbs: acc.carbs + meal.totalCarbs,
        fat: acc.fat + meal.totalFat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const targets = profile
      ? computeNutritionTargets(profile as unknown as NutritionProfileInput)
      : null;

    res.json({
      meals: mealsWithTotals,
      totalCalories: dayTotals.calories,
      totalProtein: dayTotals.protein,
      totalCarbs: dayTotals.carbs,
      totalFat: dayTotals.fat,
      targetCalories: targets?.dailyCalories ?? null,
      targetProtein: targets?.dailyProtein ?? null,
      targetCarbs: targets?.dailyCarbs ?? null,
      targetFat: targets?.dailyFat ?? null,
      carbsTargetClamped: targets?.carbsClamped ?? false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des repas." });
  }
}

export async function deleteMeal(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const mealId = req.params.mealId as string;

    const meal = await prisma.meal.findFirst({ where: { id: mealId, userId } });
    if (!meal) {
      return res.status(404).json({ error: "Repas introuvable." });
    }

    await prisma.meal.delete({ where: { id: mealId } });
    res.json({ message: "Repas supprimé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression du repas." });
  }
}

export async function addMealIngredient(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const mealId = req.params.mealId as string;
    const parseResult = mealIngredientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { name, weightInGrams, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, openFoodFactsId } =
      parseResult.data;

    const meal = await prisma.meal.findFirst({ where: { id: mealId, userId } });
    if (!meal) {
      return res.status(404).json({ error: "Repas introuvable." });
    }

    const ingredient = await prisma.mealIngredient.create({
      data: {
        name,
        weightInGrams,
        caloriesPer100g,
        proteinPer100g,
        carbsPer100g: carbsPer100g ?? null,
        fatPer100g: fatPer100g ?? null,
        openFoodFactsId: openFoodFactsId || null,
        mealId,
      },
    });

    res.status(201).json({ ...ingredient, ...ingredientTotals(ingredient) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout de l'ingrédient." });
  }
}

export async function removeMealIngredient(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const ingredientId = req.params.ingredientId as string;

    const ingredient = await prisma.mealIngredient.findFirst({
      where: { id: ingredientId, meal: { userId } },
    });
    if (!ingredient) {
      return res.status(404).json({ error: "Ingrédient introuvable." });
    }

    await prisma.mealIngredient.delete({ where: { id: ingredientId } });
    res.json({ message: "Ingrédient supprimé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression de l'ingrédient." });
  }
}
