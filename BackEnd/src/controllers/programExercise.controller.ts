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