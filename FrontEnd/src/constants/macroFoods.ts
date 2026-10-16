/**
 * Exemples d'aliments riches en chaque macronutriment, affichés dans l'accordéon
 * « Où en trouver ? » sous les barres de progression de l'écran nutrition.
 * Contenu fixe et volontairement simple : ce sont des repères, pas une liste exhaustive.
 */

/** Sources de protéines (animales et végétales). */
export const PROTEIN_FOODS = [
  "Poulet",
  "Dinde",
  "Bœuf maigre",
  "Poisson",
  "Thon",
  "Œufs",
  "Fromage blanc",
  "Skyr",
  "Lentilles",
  "Pois chiches",
  "Tofu",
] as const;

/** Sources de glucides (féculents, céréales, fruits). */
export const CARB_FOODS = [
  "Riz",
  "Pâtes",
  "Pain",
  "Pommes de terre",
  "Patate douce",
  "Flocons d'avoine",
  "Quinoa",
  "Semoule",
  "Lentilles",
  "Banane",
  "Fruits secs",
] as const;

/** Sources de lipides (huiles, oléagineux, poissons gras). */
export const FAT_FOODS = [
  "Huile d'olive",
  "Huile de colza",
  "Amandes",
  "Noix",
  "Cacahuètes",
  "Purée d'amande",
  "Avocat",
  "Saumon",
  "Sardine",
  "Maquereau",
  "Jaune d'œuf",
  "Chocolat noir",
  "Graines de chia",
] as const;

/** Rappel affiché en bas de chaque liste : un aliment apporte souvent plusieurs macros. */
export const MIXED_FOODS_NOTE =
  "Beaucoup d'aliments sont mixtes et apportent à la fois glucides et lipides (chocolat, biscuits, chips…).";
