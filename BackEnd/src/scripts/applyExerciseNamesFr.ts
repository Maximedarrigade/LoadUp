import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import prisma from "../lib/prisma";
import { Prisma } from "../../generated/prisma/client";

// Remplit ExerciseLibrary.nameFr depuis data/exercise-names-fr.json.
// Relançable sans risque : seules les lignes dont le nom français change sont écrites,
// et `name` (le nom anglais d'ExerciseDB) n'est jamais modifié.

const FILE = path.join(__dirname, "../../data/exercise-names-fr.json");
const CHUNK = 200;

type NamesFile = { glossaire: Record<string, string>; noms: Record<string, string> };

async function main() {
  const file = JSON.parse(readFileSync(FILE, "utf8")) as NamesFile;
  const entries = Object.entries(file.noms)
    .map(([id, fr]) => [id, fr.trim()] as const)
    .filter(([, fr]) => fr.length > 0);

  const existing = await prisma.exerciseLibrary.findMany({ select: { id: true, nameFr: true } });
  const known = new Set(existing.map((e) => e.id));

  const unknownIds = entries.filter(([id]) => !known.has(id)).map(([id]) => id);
  const toApply = entries.filter(([id]) => known.has(id));

  let updated = 0;
  for (let i = 0; i < toApply.length; i += CHUNK) {
    const rows = toApply.slice(i, i + CHUNK).map(([id, fr]) => Prisma.sql`(${id}, ${fr})`);
    updated += await prisma.$executeRaw`
      UPDATE "ExerciseLibrary" AS e
      SET "nameFr" = v.fr
      FROM (VALUES ${Prisma.join(rows)}) AS v(id, fr)
      WHERE e.id = v.id AND e."nameFr" IS DISTINCT FROM v.fr
    `;
  }

  const translated = new Set(toApply.map(([id]) => id));
  const missing = existing.filter((e) => !translated.has(e.id) && !e.nameFr).length;

  console.log(`${toApply.length} traductions dans le fichier, ${updated} ligne(s) mise(s) à jour.`);
  if (unknownIds.length) {
    console.warn(`${unknownIds.length} id(s) absent(s) du catalogue, ignoré(s) : ${unknownIds.join(", ")}`);
  }
  if (missing) console.warn(`${missing} exercice(s) du catalogue sans nom français (affichés en anglais).`);
}

main()
  .catch((error) => {
    console.error("Erreur lors de l'application des noms français :", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
