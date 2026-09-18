import api from "./client";

export async function getStreak() {
  const response = await api.get("/me/streak");
  return response.data;
}
