import api from "./client";

export type MealIngredient = {
  id: string;
  name: string;
  weightInGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  openFoodFactsId: string | null;
};

export type Meal = {
  id: string;
  name: string;
  date: string;
  ingredients: MealIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

export type DayMeals = {
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
  caloriesTargetClamped: boolean;
  carbsTargetClamped: boolean;
};

export async function getMealsByDate(date?: string): Promise<DayMeals> {
  const response = await api.get("/meals", { params: date ? { date } : {} });
  return response.data;
}

export async function createMeal(name: string): Promise<Meal> {
  const response = await api.post("/meals", { name });
  return response.data;
}

export async function deleteMeal(mealId: string) {
  const response = await api.delete(`/meals/${mealId}`);
  return response.data;
}

export async function addMealIngredient(
  mealId: string,
  ingredient: {
    name: string;
    weightInGrams: number;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g?: number | null;
    fatPer100g?: number | null;
    openFoodFactsId?: string;
  }
) {
  const response = await api.post(`/meals/${mealId}/ingredients`, ingredient);
  return response.data;
}

export async function removeMealIngredient(ingredientId: string) {
  const response = await api.delete(`/meals/ingredients/${ingredientId}`);
  return response.data;
}
