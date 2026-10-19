import { existsSync, readFileSync } from "fs";
import path from "path";

// Séances et programmes prêts (data/workout-templates.json, versionné avec le code).

export type TemplateExercise = { exerciseLibraryId: string; sets: number; reps: number; rest: number };
export type TemplateSession = { id: string; name: string; focus: string; exercises: TemplateExercise[] };
export type TemplateProgramDay = { session: string; name?: string };
export type TemplateProgram = { id: string; name: string; description: string; days: TemplateProgramDay[] };
type TemplatesFile = { sessions: TemplateSession[]; programs: TemplateProgram[] };

let templates: TemplatesFile | null = null;

// La racine du backend contient package.json ; dist/ (compilé) et src/ (tsx) sont en dessous.
function dataFile() {
  let dir = __dirname;
  while (!existsSync(path.join(dir, "package.json"))) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Racine du backend introuvable");
    dir = parent;
  }
  return path.join(dir, "data", "workout-templates.json");
}

export function loadTemplates(): TemplatesFile {
  if (!templates) {
    const file = JSON.parse(readFileSync(dataFile(), "utf8")) as TemplatesFile;
    const sessionIds = new Set(file.sessions.map((s) => s.id));
    for (const program of file.programs) {
      for (const day of program.days) {
        if (!sessionIds.has(day.session)) {
          throw new Error(`Programme prêt « ${program.id} » : séance inconnue « ${day.session} ».`);
        }
      }
    }
    templates = file;
  }
  return templates;
}

export function findTemplateSession(id: string) {
  return loadTemplates().sessions.find((s) => s.id === id) ?? null;
}

export function findTemplateProgram(id: string) {
  return loadTemplates().programs.find((p) => p.id === id) ?? null;
}

/** Les jours d'un programme prêt, avec leur nom final et leur séance. */
export function programDays(program: TemplateProgram) {
  return program.days.map((day) => {
    const session = findTemplateSession(day.session) as TemplateSession;
    return { name: day.name ?? session.name, session };
  });
}

export function allExerciseIds() {
  return Array.from(new Set(loadTemplates().sessions.flatMap((s) => s.exercises.map((e) => e.exerciseLibraryId))));
}
