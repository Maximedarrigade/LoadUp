import { Request, Response } from "express";
import prisma from "../lib/prisma";
import {
  computeNutritionTargets,
  Gender,
  ActivityLevel,
  Goal,
  NutritionProfileInput,
} from "../lib/nutrition";

const GENDERS: Gender[] = ["male", "female"];
const ACTIVITY_LEVELS: ActivityLevel[] = ["sedentary", "light", "moderate", "active"];
const GOALS: Goal[] = ["cut", "bulk"];

export async function getNutritionProfile(req: Request, res: Response) {
  try {
    const userId = req.userId as string;

    const profile = await prisma.nutritionProfile.findUnique({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ error: "Profil nutritionnel introuvable." });
    }

    res.json({ ...profile, ...computeNutritionTargets(profile as unknown as NutritionProfileInput) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération du profil nutritionnel." });
  }
}

export async function upsertNutritionProfile(req: Request, res: Response) {
  try {
    const userId = req.userId as string;
    const { weight, height, age, gender, activityLevel, goal } = req.body;

    if (
      !weight ||
      !height ||
      !age ||
      !GENDERS.includes(gender) ||
      !ACTIVITY_LEVELS.includes(activityLevel) ||
      !GOALS.includes(goal)
    ) {
      return res.status(400).json({
        error: "Poids, taille, âge, sexe, niveau d'activité et objectif sont requis et doivent être valides.",
      });
    }

    const data = { weight, height, age, gender, activityLevel, goal };

    const profile = await prisma.nutritionProfile.upsert({
      where: { userId },
      create: { ...data, userId },
      update: data,
    });

    res.json({ ...profile, ...computeNutritionTargets(profile as unknown as NutritionProfileInput) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement du profil nutritionnel." });
  }
}
