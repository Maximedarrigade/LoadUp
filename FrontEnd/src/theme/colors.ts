/**
 * "Iron Log" — palette de couleurs unique de l'application (pas de variante claire :
 * l'esprit atelier/industriel du design est pensé pour un fond sombre).
 * Toutes les couleurs de l'app doivent venir d'ici plutôt que d'être en dur dans les écrans.
 */
export const Colors = {
  bg: "#141311", // fond principal, noir charbon chaud
  surface: "#1E1C19", // cartes, blocs
  surface2: "#262320", // fond des headers d'écran, légèrement plus clair
  ink: "#F3EFE7", // texte principal, blanc craie
  muted: "#8C877D", // texte secondaire, labels
  line: "#38352F", // bordures, séparateurs
  accent: "#FF4520", // orange sécurité — CTA, liens actifs, highlights
  flame: "#FFB020", // ambre — streak, alertes positives, timers

  // Alias fonctionnels dérivés de la palette de base, pour éviter de recoder
  // du orange/rouge "en dur" pour les états d'erreur ou de danger.
  danger: "#FF4520",
} as const;

export type ColorToken = keyof typeof Colors;
