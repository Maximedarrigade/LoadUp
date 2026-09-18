export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type Goal = "cut" | "bulk";

export type NutritionProfileInput = {
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const GOAL_CALORIE_ADJUSTMENT: Record<Goal, number> = {
  cut: -500,
  bulk: 400,
};

const GOAL_PROTEIN_PER_KG: Record<Goal, number> = {
  cut: 2.1,
  bulk: 1.8,
};

export function calculateBMR({ weight, height, age, gender }: NutritionProfileInput): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(profile: NutritionProfileInput): number {
  return calculateBMR(profile) * ACTIVITY_MULTIPLIERS[profile.activityLevel];
}

export function computeNutritionTargets(profile: NutritionProfileInput) {
  const tdee = calculateTDEE(profile);
  const dailyCalories = Math.round(tdee + GOAL_CALORIE_ADJUSTMENT[profile.goal]);
  const dailyProtein = Math.round(profile.weight * GOAL_PROTEIN_PER_KG[profile.goal]);

  return { dailyCalories, dailyProtein };
}
