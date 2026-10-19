import { Request, Response } from "express";
import prisma from "../lib/prisma";
import {
  allExerciseIds,
  findTemplateProgram,
  findTemplateSession,
  loadTemplates,
  programDays,
  type TemplateSession,
} from "../lib/workoutTemplates";
import { applySessionTemplateSchema } from "../validators/workoutTemplate.validator";

type LibraryRow = { id: string; name: string; nameFr: string | null; gifUrl: string; bodyParts: string[] };

// Exercices du catalogue utilisés par les modèles. Un exercice retiré du catalogue
// (re-sync) est simplement ignoré plutôt que de casser le modèle.
async function loadLibrary(): Promise<Map<string, LibraryRow>> {
  const rows = await prisma.exerciseLibrary.findMany({
    where: { id: { in: allExerciseIds() } },
    select: { id: true, name: true, nameFr: true, gifUrl: true, bodyParts: true },
  });
  return new Map(rows.map((row) => [row.id, row]));
}

// Exercices à créer pour une séance : copie normale, reliée au catalogue (GIF, nom français).
// Le nom enregistré est le nom anglais du catalogue, comme un ajout depuis le catalogue.
function exercisesData(session: TemplateSession, library: Map<string, LibraryRow>) {
  return session.exercises
    .filter((exercise) => library.has(exercise.exerciseLibraryId))
    .map((exercise, order) => ({
      name: (library.get(exercise.exerciseLibraryId) as LibraryRow).name,
      targetSets: exercise.sets,
      targetReps: exercise.reps,
      restDuration: exercise.rest,
      order,
      exerciseLibraryId: exercise.exerciseLibraryId,
    }));
}

async function nextProgramOrder(userId: string) {
  // Nouveau programme en tête de liste, comme une création classique.
  const { _min } = await prisma.program.aggregate({ where: { userId }, _min: { order: true } });
  return _min.order === null ? 0 : _min.order - 1;
}

function programWithDays(id: string) {
  return prisma.program.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { order: "asc" },
        include: { exercises: { orderBy: { order: "asc" }, include: { exerciseLibrary: true } } },
      },
    },
  });
}

export async function listWorkoutTemplates(req: Request, res: Response) {
  try {
    const { sessions, programs } = loadTemplates();
    const library = await loadLibrary();

    res.json({
      sessions: sessions.map((session) => ({
        id: session.id,
        name: session.name,
        focus: session.focus,
        exercises: session.exercises
          .filter((exercise) => library.has(exercise.exerciseLibraryId))
          .map((exercise) => {
            const row = library.get(exercise.exerciseLibraryId) as LibraryRow;
            return {
              exerciseLibraryId: row.id,
              name: row.name,
              nameFr: row.nameFr,
              gifUrl: row.gifUrl,
              bodyParts: row.bodyParts,
              sets: exercise.sets,
              reps: exercise.reps,
              rest: exercise.rest,
            };
          }),
      })),
      programs: programs.map((program) => ({
        id: program.id,
        name: program.name,
        description: program.description,
        days: programDays(program).map((day) => ({ name: day.name, sessionId: day.session.id })),
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des modèles." });
  }
}

// Ajoute une séance prête : nouveau jour à la fin d'un programme existant,
// ou nouveau programme contenant cette seule séance.
export async function applySessionTemplate(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const session = findTemplateSession(req.params.templateId as string);
    if (!session) {
      return res.status(404).json({ error: "Séance prête introuvable." });
    }
    const parseResult = applySessionTemplateSchema.safeParse(req.body ?? {});
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { programId } = parseResult.data;
    const library = await loadLibrary();
    const exercises = exercisesData(session, library);

    if (programId) {
      const program = await prisma.program.findFirst({ where: { id: programId, userId } });
      if (!program) {
        return res.status(404).json({ error: "Programme introuvable." });
      }
      const { _max } = await prisma.programDay.aggregate({ where: { programId }, _max: { order: true } });
      const day = await prisma.programDay.create({
        data: {
          name: session.name,
          order: _max.order === null ? 0 : _max.order + 1,
          programId,
          exercises: { create: exercises },
        },
      });
      return res.status(201).json({ programId, dayId: day.id, program: await programWithDays(programId) });
    }

    const program = await prisma.program.create({
      data: {
        name: session.name,
        description: session.focus,
        order: await nextProgramOrder(userId),
        userId,
        days: { create: [{ name: session.name, order: 0, exercises: { create: exercises } }] },
      },
      include: { days: true },
    });
    res.status(201).json({ programId: program.id, dayId: program.days[0].id, program: await programWithDays(program.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout de la séance prête." });
  }
}

// Copie un programme prêt dans les programmes de l'utilisateur (copie normale, modifiable).
export async function applyProgramTemplate(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const template = findTemplateProgram(req.params.templateId as string);
    if (!template) {
      return res.status(404).json({ error: "Programme prêt introuvable." });
    }
    const library = await loadLibrary();

    // Création imbriquée : programme, jours et exercices sont écrits ensemble ou pas du tout.
    const program = await prisma.program.create({
      data: {
        name: template.name,
        description: template.description,
        order: await nextProgramOrder(userId),
        userId,
        days: {
          create: programDays(template).map((day, order) => ({
            name: day.name,
            order,
            exercises: { create: exercisesData(day.session, library) },
          })),
        },
      },
    });
    res.status(201).json({ programId: program.id, program: await programWithDays(program.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la création du programme prêt." });
  }
}
