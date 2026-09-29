import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { updateUserStreak } from "../lib/streak";

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

    await updateUserStreak(userId);

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
type HistoryEntry = {
  id: string;
  date: Date;
  source: "log" | "session";
  // Série de référence : le poids le plus lourd (et ses répétitions) de l'entrée.
  weightUsed: number;
  repsDone: number;
  setsDone: number;
  sets: { setIndex: number; weightUsed: number; repsDone: number }[];
};

// Historique unifié d'un exercice : anciens WorkoutLog (un résumé par exercice, en lecture seule)
// + séances WorkoutSession (le détail série par série), du plus récent au plus ancien.
export async function getExerciseHistory(req: Request, res: Response) {
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

    const [logs, sets] = await Promise.all([
      prisma.workoutLog.findMany({ where: { programExerciseId: exerciseId } }),
      prisma.workoutSet.findMany({
        where: { programExerciseId: exerciseId },
        include: { session: { select: { startedAt: true } } },
        orderBy: { setIndex: "asc" },
      }),
    ]);

    const entries: HistoryEntry[] = logs.map((log) => ({
      id: log.id,
      date: log.date,
      source: "log",
      weightUsed: log.weightUsed,
      repsDone: log.repsDone,
      setsDone: log.setsDone,
      sets: [],
    }));

    const bySession = new Map<string, HistoryEntry>();
    for (const set of sets) {
      let entry = bySession.get(set.sessionId);
      if (!entry) {
        entry = {
          id: set.sessionId,
          date: set.session.startedAt,
          source: "session",
          weightUsed: set.weightUsed,
          repsDone: set.repsDone,
          setsDone: 0,
          sets: [],
        };
        bySession.set(set.sessionId, entry);
      }
      entry.sets.push({ setIndex: set.setIndex, weightUsed: set.weightUsed, repsDone: set.repsDone });
      entry.setsDone = entry.sets.length;
      const heavier = set.weightUsed > entry.weightUsed;
      const sameWeightMoreReps = set.weightUsed === entry.weightUsed && set.repsDone > entry.repsDone;
      if (heavier || sameWeightMoreReps) {
        entry.weightUsed = set.weightUsed;
        entry.repsDone = set.repsDone;
      }
    }

    entries.push(...bySession.values());
    entries.sort((a, b) => b.date.getTime() - a.date.getTime());

    res.json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération de l'historique." });
  }
}
