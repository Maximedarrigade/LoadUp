import { z } from "zod";
import { safeText } from "./common.validator";

export const programDaySchema = z.object({
  name: safeText(2, 100, "Le nom du jour"),
  order: z.number().int().optional(),
});
