import api from "./client";

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type Goal = "cut" | "bulk";

export type NutritionProfile = {
  id: string;
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
  dailyCalories: number;
  dailyProtein: number;
};

export async function getNutritionProfile(): Promise<NutritionProfile> {
  const response = await api.get("/nutrition-profile");
  return response.data;
}

export async function saveNutritionProfile(profile: {
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
}): Promise<NutritionProfile> {
  const response = await api.put("/nutrition-profile", profile);
  return response.data;
}
