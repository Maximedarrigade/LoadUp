import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { Prisma } from "../../generated/prisma/client";

const PAGE_SIZE = 30;

// Mêmes lettres des deux côtés : « developpe couche » trouve « Développé couché ».
const ACCENTED = "àâäáãåçéèêëíìîïñóòôöõúùûüýÿ";
const PLAIN = "aaaaaaceeeeiiiinooooouuuuyy";

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae");
}

// Ids des exercices dont le nom français ou anglais contient chaque mot recherché.
async function searchExerciseIds(search: string) {
  const words = normalize(search).split(/\s+/).filter(Boolean).slice(0, 8);
  const haystack = Prisma.sql`(translate(replace(replace(lower(coalesce("nameFr", '')), 'œ', 'oe'), 'æ', 'ae'), ${ACCENTED}, ${PLAIN}) || ' ' || lower(name))`;
  const conditions = words.map((word) => {
    const pattern = `%${word.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    return Prisma.sql`${haystack} LIKE ${pattern}`;
  });
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "ExerciseLibrary" WHERE ${Prisma.join(conditions, " AND ")}
  `;
  return rows.map((row) => row.id);
}

export async function listExerciseLibrary(req: Request, res: Response) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const bodyPart = typeof req.query.bodyPart === "string" ? req.query.bodyPart.trim() : "";
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

    const matchingIds = search ? await searchExerciseIds(search) : null;

    const where = {
      ...(matchingIds ? { id: { in: matchingIds } } : {}),
      ...(bodyPart ? { bodyParts: { has: bodyPart } } : {}),
    };

    const exercises = await prisma.exerciseLibrary.findMany({
      where,
      // Ordre alphabétique du nom affiché (français s'il existe, sinon anglais).
      orderBy: [{ nameFr: { sort: "asc", nulls: "last" } }, { name: "asc" }, { id: "asc" }],
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
