import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { programSchema } from "../validators/program.validator";

export async function createProgram(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const parseResult = programSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { name, description } = parseResult.data;

    const program = await prisma.program.create({
      data: { name, description, userId },
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
            exercises: { orderBy: { order: "asc" }, include: { exerciseLibrary: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
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
            exercises: { orderBy: { order: "asc" }, include: { exerciseLibrary: true } },
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