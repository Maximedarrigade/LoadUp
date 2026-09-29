import { z } from "zod";

export const startSessionSchema = z.object({
  programDayId: z.string().min(1, "Le jour de programme est requis.").max(100),
});

export const workoutSetSchema = z.object({
  programExerciseId: z.string().min(1, "L'exercice est requis.").max(100),
  setIndex: z.number().int().min(1, "Numéro de série invalide.").max(100, "Numéro de série invalide."),
  weightUsed: z.number().min(0, "Le poids doit être positif ou nul.").max(1000, "Poids invalide."),
  repsDone: z.number().int().min(0, "Les répétitions doivent être positives ou nulles.").max(1000, "Répétitions invalides."),
  // Absent lors d'une correction de poids/reps : le ressenti déjà enregistré est conservé.
  feeling: z.enum(["easy", "normal", "hard"], { error: "Ressenti invalide." }).optional(),
});
