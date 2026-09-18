// Vercel's CLI hardcodes "node_modules" in its always-ignored file list, and
// this cannot be overridden with a .vercelignore. Expo's web export places
// @expo/vector-icons font files under dist/assets/node_modules/..., so
// Vercel silently drops them from the deployment (icons render as empty
// boxes on web/PWA, even though everything works fine in Expo Go).
//
// This renames that directory and rewrites the matching string in the
// exported JS bundles so the icon fonts are actually served in production.
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const oldDir = path.join(distDir, "assets", "node_modules");
const newDirName = "vendor-fonts";
const newDir = path.join(distDir, "assets", newDirName);

if (!fs.existsSync(oldDir)) {
  console.log("Pas de dist/assets/node_modules à corriger, rien à faire.");
  process.exit(0);
}

fs.renameSync(oldDir, newDir);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".js")) files.push(full);
  }
}

const jsFiles = [];
walk(path.join(distDir, "_expo"), jsFiles);

let patchedCount = 0;
for (const file of jsFiles) {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("assets/node_modules/")) {
    fs.writeFileSync(file, content.split("assets/node_modules/").join(`assets/${newDirName}/`));
    patchedCount++;
  }
}

console.log(`Corrigé : assets/node_modules -> assets/${newDirName} (${patchedCount} fichier(s) JS mis à jour).`);
