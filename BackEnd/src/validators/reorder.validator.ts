import { z } from "zod";

// Nouvel ordre après un glisser-déposer : la liste complète des ids, dans l'ordre voulu.
export const reorderSchema = z.object({
  ids: z
    .array(z.string().min(1).max(100))
    .min(1, "La liste à réordonner est vide.")
    .max(500, "Trop d'éléments à réordonner.")
    .refine((ids) => new Set(ids).size === ids.length, "La liste contient des doublons."),
});

// Vrai si `ids` contient exactement les ids attendus (dans n'importe quel ordre).
export function hasSameIds(ids: string[], expected: string[]) {
  const expectedSet = new Set(expected);
  return ids.length === expectedSet.size && ids.every((id) => expectedSet.has(id));
}
