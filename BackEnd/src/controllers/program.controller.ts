import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { programSchema } from "../validators/program.validator";
import { hasSameIds, reorderSchema } from "../validators/reorder.validator";

export async function createProgram(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const parseResult = programSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { name, description } = parseResult.data;

    // Nouveau programme en tête de liste.
    const { _min } = await prisma.program.aggregate({ where: { userId }, _min: { order: true } });
    const order = _min.order === null ? 0 : _min.order - 1;

    const program = await prisma.program.create({
      data: { name, description, order, userId },
    });

    res.status(201).json(program);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la création du programme." });
  }
}

export async function getPrograms(req: Request, res: Response) {
  try {
    const userId = req.userId as string;

    const programs = await prisma.program.findMany({
      where: { userId },
      include: {
        days: {
          orderBy: { order: "asc" },
          include: {
            exercises: {
              orderBy: [{ order: "asc" }, { createdAt: "asc" }],
              include: { exerciseLibrary: true },
            },
          },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    res.json(programs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des programmes." });
  }
}

export async function getProgramById(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    const program = await prisma.program.findFirst({
      where: { id, userId },
      include: {
        days: {
          orderBy: { order: "asc" },
          include: {
            exercises: {
              orderBy: [{ order: "asc" }, { createdAt: "asc" }],
              include: { exerciseLibrary: true },
            },
          },
        },
      },
    });

    if (!program) {
      return res.status(404).json({ error: "Programme introuvable." });
    }

    res.json(program);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération du programme." });
  }
}

export async function updateProgram(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const parseResult = programSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { name, description } = parseResult.data;

    const program = await prisma.program.findFirst({ where: { id, userId } });
    if (!program) {
      return res.status(404).json({ error: "Programme introuvable." });
    }

    const updated = await prisma.program.update({
      where: { id },
      data: { name, description },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la modification du programme." });
  }
}

export async function deleteProgram(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;

    const program = await prisma.program.findFirst({ where: { id, userId } });
    if (!program) {
      return res.status(404).json({ error: "Programme introuvable." });
    }

    await prisma.program.delete({ where: { id } });

    res.json({ message: "Programme supprimé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression du programme." });
  }
}
export async function reorderPrograms(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const parseResult = reorderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { ids } = parseResult.data;

    const programs = await prisma.program.findMany({ where: { userId }, select: { id: true } });
    if (!hasSameIds(ids, programs.map((program) => program.id))) {
      return res.status(400).json({ error: "La liste ne correspond pas à tes programmes. Recharge la page." });
    }

    await prisma.$transaction(
      ids.map((id, index) => prisma.program.update({ where: { id }, data: { order: index } }))
    );

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors du réordonnancement des programmes." });
  }
}
