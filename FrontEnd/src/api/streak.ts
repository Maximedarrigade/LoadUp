import api from "./client";

export async function getStreak() {
  const response = await api.get("/me/streak");
  return response.data;
}

export type WeekSummary = { sessionCount: number; totalVolume: number };

// Lundi 0 h de la semaine en cours, à l'heure locale de l'appareil.
function startOfCurrentWeek() {
  const date = new Date();
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getWeekSummary(): Promise<WeekSummary> {
  const response = await api.get("/me/week-summary", {
    params: { from: startOfCurrentWeek().toISOString() },
  });
  return response.data;
}
