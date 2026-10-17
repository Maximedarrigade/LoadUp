import { NextFunction, Request, Response } from "express";
import { analyzeMealPhoto, PhotoAnalysisError } from "../lib/gemini";
import { searchFoodByName, FoodResult } from "../lib/openFoodFacts";
import { bestCiqualMatch } from "../lib/ciqual";
import { matchScore } from "../lib/textMatch";

export const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;
const USER_DAILY_LIMIT = 5;
// Sum of the free-tier daily quotas of the models in the chain (AI Studio, 2026-10-17):
// 3.8 Flash 20 + 3.7 Flash 20 + 3.6 Flash 20 + 3.5 Flash-Lite 500.
const GLOBAL_DAILY_CAP = Number(process.env.GEMINI_DAILY_CAP) || 560;

// Counters live in memory on purpose (no migration): they reset when the server restarts,
// which is acceptable for a small group of friends.
const userCounts = new Map<string, { day: string; count: number }>();
let globalCount = { day: "", count: 0 };
// One analysis at a time: the server has very little memory headroom.
let analysisInProgress = false;

function dayIn(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

// Users see "5 per day" in their own day; Google resets its quotas at midnight Pacific time.
const userDay = () => dayIn("Europe/Paris");
const quotaDay = () => dayIn("America/Los_Angeles");

function userUsedToday(userId: string) {
  const entry = userCounts.get(userId);
  return entry && entry.day === userDay() ? entry.count : 0;
}

function globalUsedToday() {
  return globalCount.day === quotaDay() ? globalCount.count : 0;
}

function countModelCall() {
  const day = quotaDay();
  globalCount = { day, count: (globalCount.day === day ? globalCount.count : 0) + 1 };
}

function isJpeg(buffer: Buffer) {
  return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

// Below this similarity the match is more likely wrong than right: better to leave the line
// empty and let the user pick ("Choisir") than to suggest misleading values.
const MIN_MATCH_SCORE = 0.7;

// Ciqual first (generic foods, local, instant), Open Food Facts only as a fallback.
async function findFood(name: string): Promise<FoodResult | null> {
  const ciqual = bestCiqualMatch(name);
  if (ciqual && ciqual.match.score >= MIN_MATCH_SCORE) return ciqual.food;

  try {
    const [best] = await searchFoodByName(name);
    if (!best) return null;
    const match = matchScore(name, best.name);
    return match.headMatched && match.score >= MIN_MATCH_SCORE ? best : null;
  } catch (error) {
    console.error(`Open Food Facts: recherche "${name}" échouée`, error);
    return null;
  }
}

const ERROR_RESPONSES: Record<PhotoAnalysisError["code"], { status: number; error: string }> = {
  quota: { status: 503, error: "Le service d'analyse a atteint sa limite pour aujourd'hui. Réessaie demain ou ajoute les aliments à la main." },
  unavailable: { status: 503, error: "Le service d'analyse est indisponible pour le moment. Réessaie dans quelques minutes." },
  invalid_response: { status: 502, error: "L'analyse n'a pas donné de résultat exploitable. Réessaie avec une autre photo." },
  not_configured: { status: 503, error: "L'analyse photo n'est pas encore activée sur le serveur." },
};

// Lets the app show "X analyses left today" before the user takes a photo.
export function getPhotoQuota(req: Request, res: Response) {
  const userId = req.userId as string;
  res.json({ limit: USER_DAILY_LIMIT, remainingToday: Math.max(0, USER_DAILY_LIMIT - userUsedToday(userId)) });
}

export async function analyzeMealPhotoHandler(req: Request, res: Response) {
  const userId = req.userId as string;
  const image = req.body;

  if (!Buffer.isBuffer(image) || image.length === 0 || !isJpeg(image)) {
    return res.status(400).json({ error: "Photo manquante ou format non pris en charge (JPEG attendu).", code: "bad_image" });
  }
  if (userUsedToday(userId) >= USER_DAILY_LIMIT) {
    return res.status(429).json({
      error: `Tu as atteint la limite de ${USER_DAILY_LIMIT} analyses photo pour aujourd'hui. Tu peux toujours ajouter les aliments à la main.`,
      code: "user_limit",
    });
  }
  if (globalUsedToday() >= GLOBAL_DAILY_CAP) {
    return res.status(503).json({ error: ERROR_RESPONSES.quota.error, code: "quota" });
  }
  if (analysisInProgress) {
    return res.status(503).json({ error: "Une autre analyse est en cours. Réessaie dans quelques secondes.", code: "busy" });
  }

  analysisInProgress = true;
  try {
    const analysis = await analyzeMealPhoto(image, countModelCall);

    // Counted once the AI has answered (even "no food"), since that answer used up quota.
    const day = userDay();
    userCounts.set(userId, { day, count: userUsedToday(userId) + 1 });
    const remainingToday = USER_DAILY_LIMIT - userUsedToday(userId);

    if (!analysis.containsFood || analysis.foods.length === 0) {
      return res.status(422).json({
        error: "Aucun aliment reconnu sur cette photo. Essaie avec l'assiette bien visible et éclairée.",
        code: "no_food",
        remainingToday,
      });
    }

    // Nutrition values come from Ciqual / Open Food Facts, never from the AI. Sequential
    // lookups keep the rare Open Food Facts fallbacks within its rate limit.
    const foods = [];
    for (const food of analysis.foods) {
      foods.push({
        name: food.name,
        estimatedGrams: Math.round(food.estimatedGrams),
        match: await findFood(food.name),
      });
    }

    res.json({ foods, remainingToday });
  } catch (error) {
    if (error instanceof PhotoAnalysisError) {
      const { status, error: message } = ERROR_RESPONSES[error.code];
      return res.status(status).json({ error: message, code: error.code });
    }
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de l'analyse de la photo.", code: "server_error" });
  } finally {
    analysisInProgress = false;
  }
}

// express.raw rejects oversized bodies before our handler runs: answer in JSON like the rest of the API.
export function photoUploadErrorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ error: "Photo trop lourde (1,5 Mo maximum).", code: "too_large" });
  }
  next(error);
}
