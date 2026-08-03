import api from "./client";

export async function createWorkoutLog(
  exerciseId: string,
  weightUsed: number,
  repsDone: number,
  setsDone: number
) {
  const response = await api.post(`/exercises/${exerciseId}/logs`, {
    weightUsed,
    repsDone,
    setsDone,
  });
  return response.data;
}

export async function getWorkoutLogs(exerciseId: string) {
  const response = await api.get(`/exercises/${exerciseId}/logs`);
  return response.data;
}