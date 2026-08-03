import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function createProgramDay(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const programId = req.params.programId as string;
    const { name, order } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Le nom du jour est requis." });
    }

    const program = await prisma.program.findFirst({
      where: { id: programId, userId },
    });

    if (!program) {
      return res.status(404).json({ error: "Programme introuvable." });
    }

    const programDay = await prisma.programDay.create({
      data: { name, order: order ?? 0, programId },
    });

    res.status(201).json(programDay);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la création du jour." });
  }
}