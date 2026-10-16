import { rankByName } from "./textMatch";

const USER_AGENT = "LoadUp-Muscu/1.0 (contact: maxime.darrigade@orange.fr)";
const SEARCH_FIELDS = "code,product_name,brands,nutriments,image_small_url";

export type FoodResult = {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  /** Where the nutrition values come from. */
  source: "off" | "ciqual";
};

type RawProduct = {
  code?: string;
  product_name?: string;
  // String on the product API, array of strings on search-a-licious.
  brands?: string | string[];
  image_small_url?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
};

// Open Food Facts occasionally answers 503 under load — a couple of quick
// retries clears the vast majority of these transient failures.
async function fetchWithRetry(url: URL, retries = 4): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (response.ok) return response;
    lastResponse = response;
    if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }

  return lastResponse as Response;
}

function mapProduct(raw: RawProduct): FoodResult | null {
  const calories = raw.nutriments?.["energy-kcal_100g"];
  const protein = raw.nutriments?.proteins_100g;

  if (!raw.code || !raw.product_name || calories === undefined || protein === undefined) {
    return null;
  }

  return {
    id: raw.code,
    name: raw.product_name,
    brand: (Array.isArray(raw.brands) ? raw.brands.join(", ") : raw.brands) || null,
    imageUrl: raw.image_small_url || null,
    caloriesPer100g: calories,
    proteinPer100g: protein,
    // Carbs/fat are optional so products missing them stay searchable.
    carbsPer100g: raw.nutriments?.carbohydrates_100g ?? null,
    fatPer100g: raw.nutriments?.fat_100g ?? null,
    source: "off",
  };
}

// Full-text search goes through search-a-licious, the search service Open Food Facts
// recommends; the legacy /cgi/search.pl was often returning 503. Results are then
// re-ranked by how closely the product name matches the query, since the service's
// own relevance happily ranks "Coconut chicken korma" first for "riz blanc cuit".
export async function searchFoodByName(query: string): Promise<FoodResult[]> {
  const url = new URL("https://search.openfoodfacts.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("langs", "fr");
  url.searchParams.set("page_size", "30");
  url.searchParams.set("fields", SEARCH_FIELDS);

  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`Open Food Facts search failed with status ${response.status}`);
  }

  const data = (await response.json()) as { hits?: RawProduct[] };
  const products = (data.hits ?? []).map(mapProduct).filter((p): p is FoodResult => p !== null);
  return rankByName(query, products, (p) => p.name).slice(0, 20);
}

export async function searchFoodByBarcode(code: string): Promise<FoodResult | null> {
  const url = new URL(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
  url.searchParams.set("fields", SEARCH_FIELDS);

  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`Open Food Facts barcode lookup failed with status ${response.status}`);
  }

  const data = (await response.json()) as { status: number; product?: RawProduct };
  if (data.status !== 1 || !data.product) {
    return null;
  }

  return mapProduct(data.product);
}
