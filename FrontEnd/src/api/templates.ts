import api from "./client";

export type TemplateExercise = {
  exerciseLibraryId: string;
  name: string;
  nameFr: string | null;
  gifUrl: string;
  bodyParts: string[];
  sets: number;
  reps: number;
  rest: number;
};

export type TemplateSession = {
  id: string;
  name: string;
  focus: string;
  exercises: TemplateExercise[];
};

export type TemplateProgram = {
  id: string;
  name: string;
  description: string;
  days: { name: string; sessionId: string }[];
};

export async function getWorkoutTemplates() {
  const response = await api.get<{ sessions: TemplateSession[]; programs: TemplateProgram[] }>("/templates");
  return response.data;
}

// programId null : la séance devient un nouveau programme.
export async function applySessionTemplate(templateId: string, programId: string | null) {
  const response = await api.post<{ programId: string; dayId: string }>(
    `/templates/sessions/${templateId}/apply`,
    { programId }
  );
  return response.data;
}

export async function applyProgramTemplate(templateId: string) {
  const response = await api.post<{ programId: string }>(`/templates/programs/${templateId}/apply`);
  return response.data;
}
