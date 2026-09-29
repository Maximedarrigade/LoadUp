import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { updateUserStreak } from "../lib/streak";
import { startSessionSchema, workoutSetSchema } from "../validators/workoutSession.validator";

// Termine une séance : si aucune série n'a été validée, elle n'a pas de sens et est supprimée.
async function closeSession(sessionId: string) {
  const setCount = await prisma.workoutSet.count({ where: { sessionId } });
  if (setCount === 0) {
    await prisma.workoutSession.delete({ where: { id: sessionId } });
    return null;
  }
  return prisma.workoutSession.update({
    where: { id: sessionId },
    data: { finishedAt: new Date() },
  });
}

export async function startSession(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const parseResult = startSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { programDayId } = parseResult.data;

    const day = await prisma.programDay.findFirst({
      where: { id: programDayId, program: { userId } },
    });

    if (!day) {
      return res.status(404).json({ error: "Jour de programme introuvable." });
    }

    // Une seule séance en cours à la fois : les séances restées ouvertes sont clôturées
    // (leurs séries déjà validées sont conservées).
    const openSessions = await prisma.workoutSession.findMany({
      where: { userId, finishedAt: null },
      select: { id: true },
    });
    for (const open of openSessions) {
      await closeSession(open.id);
    }

    const session = await prisma.workoutSession.create({
      data: { userId, programDayId },
      include: { sets: true },
    });

    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors du démarrage de la séance." });
  }
}

export async function getCurrentSession(req: Request, res: Response) {
  try {
    const userId = req.userId as string;

    const session = await prisma.workoutSession.findFirst({
      where: { userId, finishedAt: null },
      orderBy: { startedAt: "desc" },
      include: { sets: { orderBy: { createdAt: "asc" } } },
    });

    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération de la séance en cours." });
  }
}

export async function saveWorkoutSet(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const sessionId = req.params.sessionId as string;
    const parseResult = workoutSetSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { programExerciseId, setIndex, weightUsed, repsDone, feeling } = parseResult.data;

    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return res.status(404).json({ error: "Séance introuvable." });
    }

    if (session.finishedAt) {
      return res.status(409).json({ error: "Cette séance est terminée, ses séries ne sont plus modifiables." });
    }

    const exercise = await prisma.programExercise.findFirst({
      where: {
        id: programExerciseId,
        programDay: { program: { userId } },
        ...(session.programDayId ? { programDayId: session.programDayId } : {}),
      },
    });

    if (!exercise) {
      return res.status(404).json({ error: "Exercice introuvable." });
    }

    // Upsert : renvoyer la même série (nouvel essai après une coupure réseau, ou correction)
    // met à jour la série existante au lieu d'en créer une deuxième.
    const workoutSet = await prisma.workoutSet.upsert({
      where: {
        sessionId_programExerciseId_setIndex: { sessionId, programExerciseId, setIndex },
      },
      create: { sessionId, programExerciseId, setIndex, weightUsed, repsDone, feeling },
      update: { weightUsed, repsDone, ...(feeling ? { feeling } : {}) },
    });

    await updateUserStreak(userId);

    res.status(201).json(workoutSet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement de la série." });
  }
}

export async function finishSession(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const sessionId = req.params.sessionId as string;

    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return res.status(404).json({ error: "Séance introuvable." });
    }

    if (session.finishedAt) {
      return res.json(session);
    }

    const closed = await closeSession(sessionId);
    res.json(closed ?? { id: sessionId, deleted: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la clôture de la séance." });
  }
}
