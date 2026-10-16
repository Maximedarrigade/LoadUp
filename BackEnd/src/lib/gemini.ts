import { z } from "zod";

// Gemini Interactions API (https://ai.google.dev/gemini-api/docs/interactions).
// Called with plain fetch on purpose: no SDK, to keep the backend's memory footprint small.
const INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const REQUEST_TIMEOUT_MS = 20_000;
// Whole analysis budget across the model chain, so the user never waits more than ~1 min
// (the frontend gives up at 90 s; AlwaysData does not document a proxy timeout).
const TOTAL_BUDGET_MS = 60_000;
// Below this, starting another model is pointless: it could not answer in time.
const MIN_MODEL_BUDGET_MS = 8_000;

// Tried in order: on a quota error (429) or an unavailable model we move to the next one.
// Override with GEMINI_MODELS="model-a,model-b" without touching the code.
const DEFAULT_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];

export function geminiModels(): string[] {
  const fromEnv = process.env.GEMINI_MODELS?.split(",").map((m) => m.trim()).filter(Boolean);
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_MODELS;
}

// Names are matched against the Ciqual table (Anses), so we ask for its vocabulary:
// main food first, then variety and cooking, singular, no brand.
const PROMPT = `Tu analyses la photo d'une assiette ou d'un repas.
Liste chaque aliment visible séparément, avec un nom générique court en français, au singulier, sans marque, dans le vocabulaire de la table nutritionnelle Ciqual : d'abord l'aliment, puis la variété ou le morceau, puis le mode de cuisson.
Exemples : "riz blanc cuit", "pâtes sèches cuites", "poulet filet grillé", "poulet cuisse rôtie", "boeuf steak haché cuit", "saumon grillé", "oeuf dur", "pomme de terre rôtie", "frites", "brocoli cuit", "haricot vert cuit", "carotte crue", "salade verte", "sauce tomate à la viande", "pain blanc", "fromage blanc", "huile d'olive".
Pour un plat composé (ex. lasagnes), donne le plat s'il est courant, sinon ses composants séparés.
Estime le poids de chaque aliment en grammes, tel qu'il est servi (cuit si cuit).
N'invente pas d'aliment que tu ne vois pas. Si la photo ne montre pas de nourriture, renvoie containsFood à false et une liste vide.`;

// JSON Schema sent to Gemini (structured output) — mirrored by the Zod schema below,
// which is what we actually trust.
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    containsFood: { type: "boolean" },
    foods: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          estimatedGrams: { type: "number" },
        },
        required: ["name", "estimatedGrams"],
      },
    },
  },
  required: ["containsFood", "foods"],
};

const analysisSchema = z.object({
  containsFood: z.boolean(),
  foods: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        estimatedGrams: z.number().positive().max(2000),
      })
    )
    .max(12),
});

export type PhotoAnalysis = z.infer<typeof analysisSchema>;

export type PhotoAnalysisErrorCode = "not_configured" | "quota" | "invalid_response" | "unavailable";

export class PhotoAnalysisError extends Error {
  constructor(public code: PhotoAnalysisErrorCode, message: string) {
    super(message);
  }
}

type InteractionResponse = {
  status?: string;
  steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
};

function extractText(body: InteractionResponse): string {
  return (body.steps ?? [])
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("");
}

/**
 * Sends the photo to Gemini and returns the detected foods.
 * `onModelCall` is invoked before each request so the caller can count them against its global cap.
 * The image only lives in memory for the duration of the call; `store: false` asks Google not to keep it.
 */
export async function analyzeMealPhoto(jpeg: Buffer, onModelCall: () => void): Promise<PhotoAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new PhotoAnalysisError("not_configured", "GEMINI_API_KEY manquante.");
  }

  const imageBase64 = jpeg.toString("base64");
  let sawQuotaError = false;
  const startedAt = Date.now();

  for (const model of geminiModels()) {
    const remaining = TOTAL_BUDGET_MS - (Date.now() - startedAt);
    if (remaining < MIN_MODEL_BUDGET_MS) {
      console.warn(`Gemini: budget de temps épuisé avant ${model}.`);
      break;
    }
    onModelCall();
    let response: Response;
    try {
      response = await fetch(INTERACTIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          model,
          store: false,
          input: [
            { type: "text", text: PROMPT },
            { type: "image", data: imageBase64, mime_type: "image/jpeg" },
          ],
          response_format: { type: "text", mime_type: "application/json", schema: RESPONSE_SCHEMA },
          generation_config: { thinking_level: "low" },
        }),
        signal: AbortSignal.timeout(Math.min(REQUEST_TIMEOUT_MS, remaining)),
      });
    } catch (error) {
      console.error(`Gemini ${model}: requête échouée`, error);
      continue;
    }

    if (response.status === 429) {
      sawQuotaError = true;
      console.warn(`Gemini ${model}: quota atteint, modèle suivant.`);
      continue;
    }
    if (!response.ok) {
      // 404 (model retired), 5xx (overloaded)… : the next model may still answer.
      console.error(`Gemini ${model}: HTTP ${response.status}`, (await response.text()).slice(0, 500));
      continue;
    }

    const body = (await response.json()) as InteractionResponse;
    let parsed: unknown;
    try {
      parsed = JSON.parse(extractText(body));
    } catch {
      console.error(`Gemini ${model}: réponse non JSON`, JSON.stringify(body).slice(0, 500));
      throw new PhotoAnalysisError("invalid_response", "Réponse de l'IA illisible.");
    }

    const result = analysisSchema.safeParse(parsed);
    if (!result.success) {
      console.error(`Gemini ${model}: réponse hors schéma`, JSON.stringify(parsed).slice(0, 500));
      throw new PhotoAnalysisError("invalid_response", "Réponse de l'IA invalide.");
    }
    return result.data;
  }

  throw sawQuotaError
    ? new PhotoAnalysisError("quota", "Quota de l'IA atteint sur tous les modèles.")
    : new PhotoAnalysisError("unavailable", "Aucun modèle d'IA disponible.");
}
