import api from "./client";

export type LibraryExercise = {
  id: string;
  name: string;
  gifUrl: string;
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
};

export async function getExerciseLibrary(params: {
  search?: string;
  bodyPart?: string;
  cursor?: string;
}) {
  const response = await api.get<{ data: LibraryExercise[]; nextCursor: string | null }>(
    "/exercise-library",
    { params }
  );
  return response.data;
}

export async function getExerciseLibraryBodyParts() {
  const response = await api.get<{ data: string[] }>("/exercise-library/bodyparts");
  return response.data.data;
}

export async function getExerciseLibraryById(id: string) {
  const response = await api.get<LibraryExercise>(`/exercise-library/${id}`);
  return response.data;
}
