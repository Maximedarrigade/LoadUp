import { z } from "zod";

const NO_HTML_REGEX = /^[^<>]*$/;
const NO_HTML_MESSAGE = "Les balises HTML ne sont pas autorisées.";

export function safeText(min: number, max: number, label = "Ce champ") {
  return z
    .string()
    .trim()
    .min(min, `${label} doit contenir au moins ${min} caractère(s).`)
    .max(max, `${label} ne doit pas dépasser ${max} caractères.`)
    .regex(NO_HTML_REGEX, NO_HTML_MESSAGE);
}

export function safeTextOptional(max: number, label = "Ce champ") {
  return z
    .string()
    .trim()
    .max(max, `${label} ne doit pas dépasser ${max} caractères.`)
    .regex(NO_HTML_REGEX, NO_HTML_MESSAGE)
    .nullable()
    .optional();
}
