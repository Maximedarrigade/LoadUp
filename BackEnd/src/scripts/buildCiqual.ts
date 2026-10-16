/**
 * Génère data/ciqual-2025.json à partir de la table Ciqual 2025 officielle de l'Anses.
 *
 *   npm run build:ciqual
 *
 * Source : Anses. 2025. Table de composition nutritionnelle des aliments Ciqual 2025.
 * https://doi.org/10.57745/RDMHWY — Licence Ouverte / Etalab 2.0 (citation de la source obligatoire).
 *
 * Le fichier .xlsx est téléchargé depuis Recherche Data Gouv, son md5 est vérifié, puis seules
 * les colonnes utiles à l'app sont conservées (énergie kcal, protéines, glucides, lipides).
 * Aucune dépendance : le .xlsx est une archive zip de fichiers XML, lue avec zlib.
 */
import { createHash } from "crypto";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import zlib from "zlib";

const SOURCE_URL = "https://entrepot.recherche.data.gouv.fr/api/access/datafile/666260";
const SOURCE_MD5 = "0d9758ce23f3f13dd63a005bc1bb4f2c";
// Hors de src/ : lu à l'exécution depuis la racine du backend (tsx comme node compilé).
const OUTPUT = path.join(__dirname, "../../data/ciqual-2025.json");

// En-têtes de colonnes de l'onglet « composition nutritionnelle » (espaces normalisés).
const COLUMNS = {
  code: "alim_code",
  name: "alim_nom_fr",
  kcal: "Energie, Règlement UE N° 1169 2011 (kcal 100 g)",
  protein: "Protéines, N x facteur de Jones (g 100 g)",
  carbs: "Glucides (g 100 g)",
  fat: "Lipides (g 100 g)",
};

/** Lit les fichiers d'une archive zip (répertoire central + inflate). */
function readZip(buffer: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  const eocd = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("Archive zip invalide");
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeader = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    const dataStart =
      localHeader + 30 + buffer.readUInt16LE(localHeader + 26) + buffer.readUInt16LE(localHeader + 28);
    const data = buffer.subarray(dataStart, dataStart + compressedSize);
    files.set(name, method === 8 ? zlib.inflateRawSync(data) : Buffer.from(data));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

function decodeXml(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

const normalizeSpaces = (s: string) => s.replace(/\s+/g, " ").trim();

function readFirstSheet(files: Map<string, Buffer>): string[][] {
  const shared = [...(files.get("xl/sharedStrings.xml")?.toString("utf8") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map(
    ([, si]) => decodeXml([...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(([, t]) => t).join(""))
  );
  const sheet = files.get("xl/worksheets/sheet1.xml")?.toString("utf8");
  if (!sheet) throw new Error("Onglet introuvable dans le fichier Ciqual");

  const columnIndex = (ref: string) =>
    [...ref.replace(/\d+/g, "")].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

  return [...sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map(([, row]) => {
    const cells: string[] = [];
    for (const [, attrs, body] of row.matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
      if (!ref || !body) continue;
      const type = /t="(\w+)"/.exec(attrs)?.[1];
      const value =
        type === "inlineStr"
          ? [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(([, t]) => t).join("")
          : /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
      cells[columnIndex(ref)] = type === "s" ? shared[Number(value)] : decodeXml(value);
    }
    return cells;
  });
}

// Conventions Ciqual (documentation 2025, §3.2) : "-" = valeur inconnue (ne pas remplacer par 0),
// "traces" et "< x" = teneur négligeable, comptée 0.
function parseValue(raw: string | undefined): number | null {
  const value = raw?.trim().replace(",", ".");
  if (!value || value === "-") return null;
  if (value === "traces" || value.startsWith("<")) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  console.log(`Téléchargement de ${SOURCE_URL}…`);
  const response = await fetch(SOURCE_URL, { headers: { "User-Agent": "LoadUp-Muscu/1.0 (build Ciqual)" } });
  if (!response.ok) throw new Error(`Téléchargement échoué : HTTP ${response.status}`);
  const xlsx = Buffer.from(await response.arrayBuffer());

  const md5 = createHash("md5").update(xlsx).digest("hex");
  if (md5 !== SOURCE_MD5) throw new Error(`md5 inattendu (${md5}) : le fichier source a changé, vérifier la nouvelle version.`);

  const [header, ...rows] = readFirstSheet(readZip(xlsx));
  const index = Object.fromEntries(
    Object.entries(COLUMNS).map(([key, label]) => {
      const i = header.findIndex((h) => h && normalizeSpaces(h) === label);
      if (i < 0) throw new Error(`Colonne introuvable : ${label}`);
      return [key, i];
    })
  ) as Record<keyof typeof COLUMNS, number>;

  const foods: [number, string, number, number, number | null, number | null][] = [];
  for (const row of rows) {
    const kcal = parseValue(row[index.kcal]);
    const protein = parseValue(row[index.protein]);
    // Sans énergie ni protéines, l'aliment ne peut pas servir au suivi : on l'écarte.
    if (kcal === null || protein === null || !row[index.name]) continue;
    foods.push([
      Number(row[index.code]),
      normalizeSpaces(row[index.name]),
      kcal,
      protein,
      parseValue(row[index.carbs]),
      parseValue(row[index.fat]),
    ]);
  }

  mkdirSync(path.dirname(OUTPUT), { recursive: true });
  writeFileSync(
    OUTPUT,
    JSON.stringify({
      source: "Anses. 2025. Table de composition nutritionnelle des aliments Ciqual 2025. https://doi.org/10.57745/RDMHWY",
      license: "Licence Ouverte / Etalab 2.0",
      generatedFrom: `${SOURCE_URL} (md5 ${SOURCE_MD5})`,
      columns: ["code", "nom", "kcal/100g", "proteines/100g", "glucides/100g", "lipides/100g"],
      foods,
    })
  );
  console.log(`${foods.length} aliments sur ${rows.length} écrits dans ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
