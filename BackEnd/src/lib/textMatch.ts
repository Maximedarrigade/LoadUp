// Name similarity used to rank food search results (Open Food Facts, Ciqual).
// Deliberately simple and dependency-free: accent/case-insensitive word overlap.

const STOPWORDS = new Set(["de", "du", "des", "la", "le", "les", "l", "d", "au", "aux", "a", "en", "et", "avec", "un", "une", "sans", "ou", "ex", "par"]);

function stem(word: string) {
  // Crude French plural handling: "brocolis" ~ "brocoli", "hauts" ~ "haut", "gâteaux" ~ "gâteau".
  return word.length > 3 && /[sx]$/.test(word) ? word.slice(0, -1) : word;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .map(stem);
}

export function sameWord(a: string, b: string) {
  if (a === b) return true;
  // "cuit" ~ "cuite", "roti" ~ "rotie" : shared prefix of at least 4 letters covering the shorter word.
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= 4 && long.startsWith(short);
}

export type MatchOptions = {
  /** Words that say nothing about the food itself ("sans sel ajouté"…): ignored on the name side. */
  neutral?: string[];
  /** Variants the query has to ask for explicitly ("préemballé", "cru"…), otherwise penalised. */
  penalized?: string[];
};

export type MatchScore = {
  /** ~0..1.1 — mostly "how much of the query is in the name", a bit "how little else is in the name". */
  score: number;
  /** The first query word (usually the main food, e.g. "riz" in "riz blanc cuit") is in the name. */
  headMatched: boolean;
};

const PENALTY = 0.08;
// The first word of a food name is its main food ("Courge spaghetti", "Huile d'avocat",
// "Chips … oignons caramélisés"): it must be something the query asked for.
const NAME_HEAD_BONUS = 0.1;
const NAME_HEAD_MALUS = 0.2;

export function scoreTokens(query: string[], name: string[], options: MatchOptions = {}): MatchScore {
  const has = (words: string[], w: string) => words.some((x) => sameWord(w, x));
  const nameWords = name.filter((w) => !has(options.neutral ?? [], w));
  if (query.length === 0 || nameWords.length === 0) return { score: 0, headMatched: false };

  const matched = query.filter((w) => has(nameWords, w)).length;
  const coverage = matched / query.length;
  const precision = matched / nameWords.length;
  const penalty = (options.penalized ?? []).filter((p) => has(name, p) && !has(query, p)).length * PENALTY;
  const nameHead = has(query, nameWords[0]) ? NAME_HEAD_BONUS : -NAME_HEAD_MALUS;
  return {
    score: 0.7 * coverage + 0.3 * precision - penalty + nameHead,
    headMatched: has(nameWords, query[0]),
  };
}

export function matchScore(query: string, name: string, options?: MatchOptions): MatchScore {
  return scoreTokens(tokenize(query), tokenize(name), options);
}

/** Sorts by similarity to the query; ties keep the source's own relevance order. */
export function rankByName<T>(query: string, items: T[], nameOf: (item: T) => string): T[] {
  return items
    .map((item, index) => ({ item, index, s: matchScore(query, nameOf(item)).score }))
    .sort((a, b) => b.s - a.s || a.index - b.index)
    .map((x) => x.item);
}
