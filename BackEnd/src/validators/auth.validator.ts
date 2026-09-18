import { z } from "zod";
import { safeText } from "./common.validator";

export const registerSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .max(72, "Le mot de passe ne doit pas dépasser 72 caractères."),
  name: safeText(2, 50, "Le nom"),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z
    .string()
    .min(1, "Mot de passe requis.")
    .max(72, "Le mot de passe ne doit pas dépasser 72 caractères."),
});

export const updateProfileSchema = z.object({
  name: safeText(2, 50, "Le nom").optional(),
  email: z.string().email("Email invalide.").optional(),
});