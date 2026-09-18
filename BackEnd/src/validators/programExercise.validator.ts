import { z } from "zod";
import { safeText } from "./common.validator";

export const programExerciseSchema = z.object({
  name: safeText(2, 100, "Le nom de l'exercice"),
  targetSets: z.number().int().positive("Le nombre de séries doit être positif."),
  targetReps: z.number().int().positive("Le nombre de répétitions doit être positif."),
  restDuration: z.number().int().nonnegative("La durée de pause doit être positive ou nulle."),
  order: z.number().int().optional(),
  exerciseLibraryId: z.string().max(100).optional().nullable(),
});
