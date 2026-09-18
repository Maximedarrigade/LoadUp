import api from "./client";

export type FoodResult = {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
};

export async function searchFoodByName(query: string): Promise<FoodResult[]> {
  const response = await api.get("/food-search/search", { params: { q: query } });
  return response.data.data;
}

export async function searchFoodByBarcode(code: string): Promise<FoodResult | null> {
  try {
    const response = await api.get(`/food-search/barcode/${code}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}
