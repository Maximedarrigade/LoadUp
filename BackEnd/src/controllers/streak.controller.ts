import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function getStreak(req: Request, res: Response) {
  try {
    const userId = req.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastWorkoutDate: true },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération du streak." });
  }
}
