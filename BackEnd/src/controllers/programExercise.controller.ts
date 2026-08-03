import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function createProgramExercise(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const dayId = req.params.dayId as string;
    const { name, targetSets, targetReps, restDuration, order } = req.body;

    if (!name || !targetSets || !targetReps || restDuration === undefined) {
      return res.status(400).json({
        error: "Nom, séries, répétitions et durée de pause sont requis.",
      });
    }

    const day = await prisma.programDay.findFirst({
      where: { id: dayId, program: { userId } },
    });

    if (!day) {
      return res.status(404).json({ error: "Jour d'entraînement introuvable." });
    }

    const exercise = await prisma.programExercise.create({
      data: {
        name,
        targetSets,
        targetReps,
        restDuration,
        order: order ?? 0,
        programDayId: dayId,
      },
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
    const { name, targetSets, targetReps, restDuration } = req.body;

    if (!name || !targetSets || !targetReps || restDuration === undefined) {
      return res.status(400).json({
        error: "Nom, séries, répétitions et durée de pause sont requis.",
      });
    }

    const exercise = await prisma.programExercise.findFirst({
      where: {
        id: exerciseId,
        programDay: { program: { userId } },
      },
    });

    if (!exercise) {
      return res.status(404).json({ error: "Exercice introuvable." });
    }

    const updated = await prisma.programExercise.update({
      where: { id: exerciseId },
      data: { name, targetSets, targetReps, restDuration },
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