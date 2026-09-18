import "dotenv/config";
import prisma from "../lib/prisma";

const API_BASE = "https://oss.exercisedb.dev/api/v1";
const PAGE_LIMIT = 25;
const DELAY_MS = 1200;

type ApiExercise = {
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
};

type ApiListResponse = {
  success: boolean;
  meta: {
    hasNextPage: boolean;
    nextCursor: string | null;
  };
  data: ApiExercise[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(after: string | null, attempt = 1): Promise<ApiListResponse> {
  const url = new URL(`${API_BASE}/exercises`);
  url.searchParams.set("limit", String(PAGE_LIMIT));
  if (after) url.searchParams.set("after", after);

  const response = await fetch(url);

  if (response.status === 429) {
    if (attempt > 5) throw new Error("Rate limité par l'API externe après plusieurs tentatives.");
    const backoff = DELAY_MS * attempt * 2;
    console.warn(`Rate limité (429), nouvelle tentative dans ${backoff}ms...`);
    await sleep(backoff);
    return fetchPage(after, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`Échec de l'appel API (${response.status}) sur ${url}`);
  }

  return response.json();
}

async function main() {
  let after: string | null = null;
  let page = 0;
  let total = 0;

  while (true) {
    const result = await fetchPage(after);
    page += 1;

    await Promise.all(
      result.data.map((exercise) =>
        prisma.exerciseLibrary.upsert({
          where: { id: exercise.exerciseId },
          create: {
            id: exercise.exerciseId,
            name: exercise.name,
            gifUrl: exercise.gifUrl,
            bodyParts: exercise.bodyParts,
            equipments: exercise.equipments,
            targetMuscles: exercise.targetMuscles,
            secondaryMuscles: exercise.secondaryMuscles,
            instructions: exercise.instructions,
          },
          update: {
            name: exercise.name,
            gifUrl: exercise.gifUrl,
            bodyParts: exercise.bodyParts,
            equipments: exercise.equipments,
            targetMuscles: exercise.targetMuscles,
            secondaryMuscles: exercise.secondaryMuscles,
            instructions: exercise.instructions,
          },
        })
      )
    );

    total += result.data.length;
    console.log(`Page ${page} : ${result.data.length} exercices synchronisés (total ${total}).`);

    if (!result.meta.hasNextPage || !result.meta.nextCursor) break;
    after = result.meta.nextCursor;
    await sleep(DELAY_MS);
  }

  console.log(`Synchronisation terminée : ${total} exercices en cache local.`);
}

main()
  .catch((error) => {
    console.error("Erreur lors de la synchronisation :", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
