import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Le début de semaine (lundi 0 h) est calculé par l'appli dans le fuseau de l'utilisateur.
const weekSummaryQuerySchema = z.object({
  from: z.iso.datetime({ offset: true, error: "Date de début de semaine invalide." }),
});

// Récap de la semaine : séances terminées et volume soulevé (somme poids × reps des séries validées).
// Seules les séances WorkoutSession comptent : les anciens WorkoutLog n'ont pas le détail par série.
export async function getWeekSummary(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const parseResult = weekSummaryQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }

    const from = new Date(parseResult.data.from);
    const to = new Date(from.getTime() + WEEK_MS);
    const inWeek = { userId, startedAt: { gte: from, lt: to } };

    const [sessionCount, sets] = await Promise.all([
      prisma.workoutSession.count({ where: { ...inWeek, finishedAt: { not: null } } }),
      prisma.workoutSet.findMany({
        where: { session: inWeek },
        select: { weightUsed: true, repsDone: true },
      }),
    ]);

    const totalVolume = sets.reduce((sum, set) => sum + set.weightUsed * set.repsDone, 0);

    res.json({ sessionCount, totalVolume });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération du récap de la semaine." });
  }
}
