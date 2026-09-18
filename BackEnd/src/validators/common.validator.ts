import { z } from "zod";

const NO_HTML_REGEX = /^[^<>]*$/;

const XSS_MESSAGES = [
  "Essaye encore...",
  "Tu passeras pas par ici 😏",
  "Tu vas réussir, mais pas par ici",
  "Belle tentative, mais non",
  "On t'a vu venir",
  "Niveau supérieur non débloqué",
];

function randomXssMessage() {
  return XSS_MESSAGES[Math.floor(Math.random() * XSS_MESSAGES.length)];
}

export function safeText(min: number, max: number, label = "Ce champ") {
  return z
    .string()
    .trim()
    .min(min, `${label} doit contenir au moins ${min} caractère(s).`)
    .max(max, `${label} ne doit pas dépasser ${max} caractères.`)
    .regex(NO_HTML_REGEX, { error: () => randomXssMessage() });
}

export function safeTextOptional(max: number, label = "Ce champ") {
  return z
    .string()
    .trim()
    .max(max, `${label} ne doit pas dépasser ${max} caractères.`)
    .regex(NO_HTML_REGEX, { error: () => randomXssMessage() })
    .nullable()
    .optional();
}
