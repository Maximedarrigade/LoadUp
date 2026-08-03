import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").max(50),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});