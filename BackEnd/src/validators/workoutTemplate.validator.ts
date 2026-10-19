import { z } from "zod";

// programId absent ou null : la séance devient un nouveau programme.
export const applySessionTemplateSchema = z.object({
  programId: z.string().min(1).max(100).nullable().optional(),
});
