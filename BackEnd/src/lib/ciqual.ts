import { existsSync, readFileSync } from "fs";
import path from "path";
import type { FoodResult } from "./openFoodFacts";
import { tokenize, scoreTokens, sameWord, MatchScore } from "./textMatch";

// Table Ciqual 2025 (Anses, Licence Ouverte / Etalab 2.0), extracted by `npm run build:ciqual`.
// Generic foods ("Riz blanc, cuit") are a much better fit for a plate photo than Open Food
// Facts' branded products.

type CiqualRow = [code: number, name: string, kcal: number, protein: number, carbs: number | null, fat: number | null];
type CiqualFood = { row: CiqualRow; tokens: string[] };

const MATCH_OPTIONS = {
  // Ciqual qualifiers that do not change what the food is (edible part, seasoning, averages).
  neutral: tokenize("sel ajouté aliment moyen standard précision pulpe chair peau noyau pépins"),
  penalized: tokenize("préemballé surgelé appertisé déshydraté"),
};

// Asking for a cooked food and getting a raw entry is a real error (a raw chicken thigh is not a
// roasted one), but raw is the natural state of a banana or a salad: only penalise "cru" when the
// query mentions a cooking method. "cru"/"crue" are listed apart: too short for the prefix rule.
const COOKING_WORDS = tokenize("cuit rôti grillé poêlé frit bouilli vapeur four sauté braisé mijoté");
const RAW_WORDS = ["cru", "crue"];
const RAW_WHEN_COOKED_PENALTY = 0.3;

// Common names Gemini (or people) use that Ciqual words differently.
const SYNONYMS: [RegExp, string][] = [
  [/\b(spaghettis?|tagliatelles?|penne|fusilli|macaronis?|coquillettes?|nouilles?)\b/gi, "pâtes"],
  [/\bblanc de (poulet|dinde)\b/gi, "$1 filet"],
];

function normalizeQuery(query: string) {
  return SYNONYMS.reduce((q, [pattern, replacement]) => q.replace(pattern, replacement), query);
}

let foods: CiqualFood[] | null = null;

// The backend root holds package.json; dist/ (compiled) and src/ (tsx) both sit below it.
function dataFile() {
  let dir = __dirname;
  while (!existsSync(path.join(dir, "package.json"))) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Racine du backend introuvable");
    dir = parent;
  }
  return path.join(dir, "data", "ciqual-2025.json");
}

// Loaded on first use only (~3 MB in memory), so a server that never analyses a photo pays nothing.
function load(): CiqualFood[] {
  if (!foods) {
    const { foods: rows } = JSON.parse(readFileSync(dataFile(), "utf8")) as { foods: CiqualRow[] };
    foods = rows.map((row) => ({ row, tokens: tokenize(row[1]) }));
  }
  return foods;
}

function toFoodResult([code, name, kcal, protein, carbs, fat]: CiqualRow): FoodResult {
  return {
    id: `ciqual:${code}`,
    name,
    brand: null,
    imageUrl: null,
    caloriesPer100g: kcal,
    proteinPer100g: protein,
    carbsPer100g: carbs,
    fatPer100g: fat,
    source: "ciqual",
  };
}

/** Best Ciqual entry for a generic food name, with its similarity score. */
export function bestCiqualMatch(query: string): { food: FoodResult; match: MatchScore } | null {
  const q = tokenize(normalizeQuery(query));
  const wantsCooked = q.some((w) => COOKING_WORDS.some((c) => sameWord(w, c)));
  let best: { food: CiqualFood; match: MatchScore; moyen: boolean } | null = null;
  for (const food of load()) {
    const match = scoreTokens(q, food.tokens, MATCH_OPTIONS);
    if (!match.headMatched) continue;
    if (wantsCooked && food.tokens.some((t) => RAW_WORDS.includes(t))) match.score -= RAW_WHEN_COOKED_PENALTY;
    // On a tie, prefer Ciqual's "aliment moyen" (average of the variants) over a specific one.
    const moyen = food.row[1].includes("aliment moyen");
    if (!best || match.score > best.match.score || (match.score === best.match.score && moyen && !best.moyen)) {
      best = { food, match, moyen };
    }
  }
  return best ? { food: toFoodResult(best.food.row), match: best.match } : null;
}
