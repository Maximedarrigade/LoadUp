import { z } from "zod";
import { safeText, safeTextOptional } from "./common.validator";

export const programSchema = z.object({
  name: safeText(2, 100, "Le nom du programme"),
  description: safeTextOptional(500, "La description"),
});
