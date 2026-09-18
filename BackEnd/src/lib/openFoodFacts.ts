const USER_AGENT = "LoadUp-Muscu/1.0 (contact: maxime.darrigade@orange.fr)";
const SEARCH_FIELDS = "code,product_name,brands,nutriments,image_small_url";

export type FoodResult = {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
};

type RawProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  image_small_url?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
  };
};

// The legacy search.pl endpoint intermittently returns 503 under load
// (documented by Open Food Facts as unstable) — a couple of quick retries
// clears the vast majority of these transient failures.
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
    brand: raw.brands || null,
    imageUrl: raw.image_small_url || null,
    caloriesPer100g: calories,
    proteinPer100g: protein,
  };
}

export async function searchFoodByName(query: string): Promise<FoodResult[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "20");
  url.searchParams.set("fields", SEARCH_FIELDS);

  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`Open Food Facts search failed with status ${response.status}`);
  }

  const data = (await response.json()) as { products?: RawProduct[] };
  return (data.products ?? []).map(mapProduct).filter((p): p is FoodResult => p !== null);
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
