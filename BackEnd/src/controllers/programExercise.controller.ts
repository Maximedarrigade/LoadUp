import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { programExerciseSchema } from "../validators/programExercise.validator";
import { hasSameIds, reorderSchema } from "../validators/reorder.validator";

export async function createProgramExercise(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const dayId = req.params.dayId as string;
    const parseResult = programExerciseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { name, targetSets, targetReps, restDuration, order, exerciseLibraryId } = parseResult.data;

    const day = await prisma.programDay.findFirst({
      where: { id: dayId, program: { userId } },
    });

    if (!day) {
      return res.status(404).json({ error: "Jour d'entraînement introuvable." });
    }

    if (exerciseLibraryId) {
      const libraryExercise = await prisma.exerciseLibrary.findUnique({
        where: { id: exerciseLibraryId },
      });
      if (!libraryExercise) {
        return res.status(404).json({ error: "Exercice du catalogue introuvable." });
      }
    }

    // Sans ordre explicite, l'exercice est ajouté à la fin du jour.
    let exerciseOrder = order;
    if (exerciseOrder === undefined) {
      const { _max } = await prisma.programExercise.aggregate({
        where: { programDayId: dayId },
        _max: { order: true },
      });
      exerciseOrder = _max.order === null ? 0 : _max.order + 1;
    }

    const exercise = await prisma.programExercise.create({
      data: {
        name,
        targetSets,
        targetReps,
        restDuration,
        order: exerciseOrder,
        programDayId: dayId,
        exerciseLibraryId: exerciseLibraryId ?? null,
      },
      include: { exerciseLibrary: true },
    });

    res.status(201).json(exercise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la création de l'exercice." });
  }
}

export async function updateProgramExercise(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const exerciseId = req.params.exerciseId as string;
    const parseResult = programExerciseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { name, targetSets, targetReps, restDuration, exerciseLibraryId } = parseResult.data;

    const exercise = await prisma.programExercise.findFirst({
      where: {
        id: exerciseId,
        programDay: { program: { userId } },
      },
    });

    if (!exercise) {
      return res.status(404).json({ error: "Exercice introuvable." });
    }

    if (exerciseLibraryId) {
      const libraryExercise = await prisma.exerciseLibrary.findUnique({
        where: { id: exerciseLibraryId },
      });
      if (!libraryExercise) {
        return res.status(404).json({ error: "Exercice du catalogue introuvable." });
      }
    }

    const updated = await prisma.programExercise.update({
      where: { id: exerciseId },
      data: { name, targetSets, targetReps, restDuration, exerciseLibraryId: exerciseLibraryId ?? null },
      include: { exerciseLibrary: true },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la modification de l'exercice." });
  }
}

export async function deleteProgramExercise(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const exerciseId = req.params.exerciseId as string;

    const exercise = await prisma.programExercise.findFirst({
      where: {
        id: exerciseId,
        programDay: { program: { userId } },
      },
    });

    if (!exercise) {
      return res.status(404).json({ error: "Exercice introuvable." });
    }

    await prisma.programExercise.delete({ where: { id: exerciseId } });

    res.json({ message: "Exercice supprimé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression de l'exercice." });
  }
}
export async function reorderProgramExercises(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const dayId = req.params.dayId as string;
    const parseResult = reorderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { ids } = parseResult.data;

    const day = await prisma.programDay.findFirst({
      where: { id: dayId, program: { userId } },
      include: { exercises: { select: { id: true } } },
    });

    if (!day) {
      return res.status(404).json({ error: "Jour d'entraînement introuvable." });
    }

    if (!hasSameIds(ids, day.exercises.map((exercise) => exercise.id))) {
      return res.status(400).json({ error: "La liste ne correspond pas aux exercices du jour. Recharge la page." });
    }

    await prisma.$transaction(
      ids.map((id, index) => prisma.programExercise.update({ where: { id }, data: { order: index } }))
    );

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors du réordonnancement des exercices." });
  }
}
