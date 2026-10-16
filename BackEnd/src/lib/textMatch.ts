// Name similarity used to rank food search results (Open Food Facts, Ciqual).
// Deliberately simple and dependency-free: accent/case-insensitive word overlap.

const STOPWORDS = new Set(["de", "du", "des", "la", "le", "les", "l", "d", "au", "aux", "a", "en", "et", "avec", "un", "une", "sans"]);

function stem(word: string) {
  // Crude French plural handling: "brocolis" ~ "brocoli", "hauts" ~ "haut", "gâteaux" ~ "gâteau".
  return word.length > 3 && /[sx]$/.test(word) ? word.slice(0, -1) : word;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .map(stem);
}

function sameWord(a: string, b: string) {
  if (a === b) return true;
  // "cuit" ~ "cuite", "roti" ~ "rotie" : shared prefix of at least 4 letters covering the shorter word.
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= 4 && long.startsWith(short);
}

export type MatchScore = {
  /** 0..1 — mostly "how much of the query is in the name", a bit "how little else is in the name". */
  score: number;
  /** The first query word (usually the main food, e.g. "riz" in "riz blanc cuit") is in the name. */
  headMatched: boolean;
};

export function matchScore(query: string, name: string): MatchScore {
  const q = tokenize(query);
  const n = tokenize(name);
  if (q.length === 0 || n.length === 0) return { score: 0, headMatched: false };

  const matched = q.filter((w) => n.some((x) => sameWord(w, x))).length;
  const coverage = matched / q.length;
  const precision = matched / n.length;
  return {
    score: 0.7 * coverage + 0.3 * precision,
    headMatched: n.some((x) => sameWord(q[0], x)),
  };
}

/** Sorts by similarity to the query; ties keep the source's own relevance order. */
export function rankByName<T>(query: string, items: T[], nameOf: (item: T) => string): T[] {
  return items
    .map((item, index) => ({ item, index, s: matchScore(query, nameOf(item)).score }))
    .sort((a, b) => b.s - a.s || a.index - b.index)
    .map((x) => x.item);
}
