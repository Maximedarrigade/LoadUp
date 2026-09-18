import { Request, Response } from "express";
import prisma from "../lib/prisma";

const PAGE_SIZE = 30;

export async function listExerciseLibrary(req: Request, res: Response) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const bodyPart = typeof req.query.bodyPart === "string" ? req.query.bodyPart.trim() : "";
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

    const where = {
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      ...(bodyPart ? { bodyParts: { has: bodyPart } } : {}),
    };

    const exercises = await prisma.exerciseLibrary.findMany({
      where,
      orderBy: { name: "asc" },
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasNextPage = exercises.length > PAGE_SIZE;
    const data = hasNextPage ? exercises.slice(0, PAGE_SIZE) : exercises;

    res.json({
      data,
      nextCursor: hasNextPage ? data[data.length - 1].id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération du catalogue d'exercices." });
  }
}

export async function getExerciseLibraryBodyParts(req: Request, res: Response) {
  try {
    const rows = await prisma.exerciseLibrary.findMany({
      select: { bodyParts: true },
    });

    const bodyParts = Array.from(new Set(rows.flatMap((row) => row.bodyParts))).sort();

    res.json({ data: bodyParts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des groupes musculaires." });
  }
}

export async function getExerciseLibraryById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const exercise = await prisma.exerciseLibrary.findUnique({ where: { id } });

    if (!exercise) {
      return res.status(404).json({ error: "Exercice introuvable dans le catalogue." });
    }

    res.json(exercise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération de l'exercice." });
  }
}
