import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function createWorkoutLog(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const exerciseId = req.params.exerciseId as string;
    const { weightUsed, repsDone, setsDone } = req.body;

    if (weightUsed === undefined || repsDone === undefined || setsDone === undefined) {
      return res.status(400).json({
        error: "Poids utilisé, répétitions et séries sont requis.",
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

    const log = await prisma.workoutLog.create({
      data: {
        weightUsed,
        repsDone,
        setsDone,
        programExerciseId: exerciseId,
      },
    });

    res.status(201).json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement de la séance." });
  }
}

export async function getWorkoutLogs(req: Request, res: Response) {
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

    const logs = await prisma.workoutLog.findMany({
      where: { programExerciseId: exerciseId },
      orderBy: { date: "desc" },
    });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération de l'historique." });
  }
}