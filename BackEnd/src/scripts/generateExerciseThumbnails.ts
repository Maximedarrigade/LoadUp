import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import prisma from "../lib/prisma";

// Miniatures statiques (1re image du GIF) servies par le front depuis /thumbs/<id>.webp.
// Le catalogue n'affiche plus de GIFs animés : chacun pèse ~2 Mo décodé, ce qui saturait
// la mémoire de Safari iOS. Une miniature 160x160 en WebP pèse quelques Ko.
const OUTPUT_DIR = path.resolve(__dirname, "../../../FrontEnd/public/thumbs");
const SIZE = 160; // affichée à 56 pt : 160 px couvre un écran @3x
const CONCURRENCY = 6;
const MAX_ATTEMPTS = 4;

async function downloadGif(url: string): Promise<Buffer> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}

async function generate(id: string, gifUrl: string) {
  const gif = await downloadGif(gifUrl);
  // sharp ne lit que la première image d'un GIF par défaut (pages: 1).
  const webp = await sharp(gif)
    .resize(SIZE, SIZE, { fit: "cover" })
    .webp({ quality: 72 })
    .toBuffer();
  fs.writeFileSync(path.join(OUTPUT_DIR, `${id}.webp`), webp);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const exercises = await prisma.exerciseLibrary.findMany({ select: { id: true, gifUrl: true } });
  const todo = exercises.filter((e) => !fs.existsSync(path.join(OUTPUT_DIR, `${e.id}.webp`)));
  console.log(`${exercises.length} exercices en base, ${todo.length} miniature(s) à générer.`);

  const failures: string[] = [];
  let done = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < todo.length) {
      const exercise = todo[cursor++];
      try {
        await generate(exercise.id, exercise.gifUrl);
      } catch (error) {
        failures.push(exercise.id);
        console.warn(`  Échec ${exercise.id} : ${(error as Error).message}`);
      }
      done += 1;
      if (done % 50 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`Terminé : ${todo.length - failures.length} générée(s), ${failures.length} échec(s).`);
  if (failures.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Erreur lors de la génération des miniatures :", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
