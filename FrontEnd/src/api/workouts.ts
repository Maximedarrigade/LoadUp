import api from "./client";

export type WorkoutSet = {
  id: string;
  sessionId: string;
  programExerciseId: string;
  setIndex: number;
  weightUsed: number;
  repsDone: number;
};

export type WorkoutSession = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  programDayId: string | null;
  sets: WorkoutSet[];
};

export type ExerciseHistoryEntry = {
  id: string;
  date: string;
  source: "log" | "session";
  weightUsed: number;
  repsDone: number;
  setsDone: number;
  sets: { setIndex: number; weightUsed: number; repsDone: number }[];
};

export async function startWorkoutSession(programDayId: string): Promise<WorkoutSession> {
  const response = await api.post("/sessions", { programDayId });
  return response.data;
}

export async function getCurrentWorkoutSession(): Promise<WorkoutSession | null> {
  const response = await api.get("/sessions/current");
  return response.data;
}

export async function saveWorkoutSet(
  sessionId: string,
  programExerciseId: string,
  setIndex: number,
  weightUsed: number,
  repsDone: number
): Promise<WorkoutSet> {
  const response = await api.post(`/sessions/${sessionId}/sets`, {
    programExerciseId,
    setIndex,
    weightUsed,
    repsDone,
  });
  return response.data;
}

export async function finishWorkoutSession(sessionId: string) {
  const response = await api.post(`/sessions/${sessionId}/finish`);
  return response.data;
}

export async function getExerciseHistory(exerciseId: string): Promise<ExerciseHistoryEntry[]> {
  const response = await api.get(`/exercises/${exerciseId}/history`);
  return response.data;
}
