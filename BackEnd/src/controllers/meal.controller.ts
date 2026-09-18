import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { computeNutritionTargets, NutritionProfileInput } from "../lib/nutrition";

function ingredientTotals(ingredient: { weightInGrams: number; caloriesPer100g: number; proteinPer100g: number }) {
  return {
    calories: (ingredient.caloriesPer100g / 100) * ingredient.weightInGrams,
    protein: (ingredient.proteinPer100g / 100) * ingredient.weightInGrams,
  };
}

function mealWithTotals(meal: { ingredients: any[] } & Record<string, any>) {
  const totals = meal.ingredients.reduce(
    (acc, ingredient) => {
      const t = ingredientTotals(ingredient);
      return { calories: acc.calories + t.calories, protein: acc.protein + t.protein };
    },
    { calories: 0, protein: 0 }
  );

  return {
    ...meal,
    totalCalories: Math.round(totals.calories),
    totalProtein: Math.round(totals.protein),
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
    const { name, date } = req.body;

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
      }),
      { calories: 0, protein: 0 }
    );

    const targets = profile
      ? computeNutritionTargets(profile as unknown as NutritionProfileInput)
      : null;

    res.json({
      meals: mealsWithTotals,
      totalCalories: dayTotals.calories,
      totalProtein: dayTotals.protein,
      targetCalories: targets?.dailyCalories ?? null,
      targetProtein: targets?.dailyProtein ?? null,
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
    const { name, weightInGrams, caloriesPer100g, proteinPer100g, openFoodFactsId } = req.body;

    if (!name || !weightInGrams || caloriesPer100g === undefined || proteinPer100g === undefined) {
      return res.status(400).json({
        error: "Nom, poids, calories/100g et protéines/100g sont requis.",
      });
    }

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
