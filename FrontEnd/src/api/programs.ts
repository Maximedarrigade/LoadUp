import api from "./client";

export async function getPrograms() {
  const response = await api.get("/programs");
  return response.data;
}

export async function getProgramById(id: string) {
  const response = await api.get(`/programs/${id}`);
  return response.data;
}

export async function createProgram(name: string, description: string) {
  const response = await api.post("/programs", { name, description });
  return response.data;
}

export async function updateProgram(id: string, name: string, description: string) {
  const response = await api.put(`/programs/${id}`, { name, description });
  return response.data;
}

export async function deleteProgram(id: string) {
  const response = await api.delete(`/programs/${id}`);
  return response.data;
}

export async function createProgramDay(programId: string, name: string, order: number) {
  const response = await api.post(`/programs/${programId}/days`, { name, order });
  return response.data;
}

export async function createProgramExercise(
  dayId: string,
  name: string,
  targetSets: number,
  targetReps: number,
  restDuration: number,
  order: number
) {
  const response = await api.post(`/days/${dayId}/exercises`, {
    name,
    targetSets,
    targetReps,
    restDuration,
    order,
  });
  return response.data;
}

export async function updateProgramExercise(
  exerciseId: string,
  name: string,
  targetSets: number,
  targetReps: number,
  restDuration: number
) {
  const response = await api.put(`/days/exercises/${exerciseId}`, {
    name,
    targetSets,
    targetReps,
    restDuration,
  });
  return response.data;
}

export async function deleteProgramExercise(exerciseId: string) {
  const response = await api.delete(`/days/exercises/${exerciseId}`);
  return response.data;
}