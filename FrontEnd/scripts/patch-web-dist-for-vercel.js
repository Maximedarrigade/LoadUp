// Vercel's CLI hardcodes "node_modules" in its always-ignored file list, and
// this cannot be overridden with a .vercelignore. Expo's web export places
// font files (icon fonts, and since the Iron Log redesign also the
// Oswald/JetBrains Mono/Inter Google Fonts loaded via useFonts) under
// dist/assets/node_modules/..., so Vercel silently drops them from the
// deployment — icons render as empty boxes, and custom fonts silently fail
// to load (falling back to the browser default) even though everything
// works fine in Expo Go/dev mode.
//
// This renames that directory and rewrites the matching string wherever it
// appears so the fonts are actually served in production. It's not just the
// exported JS bundles: with static rendering enabled, expo-router also
// bakes <link rel="preload"> / @font-face rules referencing the same path
// directly into each route's static .html file, so those need patching too.
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");

function fixFontPaths() {
  const oldDir = path.join(distDir, "assets", "node_modules");
  const newDirName = "vendor-fonts";
  const newDir = path.join(distDir, "assets", newDirName);

  if (!fs.existsSync(oldDir)) {
    console.log("Pas de dist/assets/node_modules à corriger, rien à faire.");
    return;
  }

  fs.renameSync(oldDir, newDir);

  function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, files);
      else if (entry.name.endsWith(".js") || entry.name.endsWith(".html")) files.push(full);
    }
    return files;
  }

  const files = walk(distDir);

  let patchedCount = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes("assets/node_modules/")) {
      fs.writeFileSync(file, content.split("assets/node_modules/").join(`assets/${newDirName}/`));
      patchedCount++;
    }
  }

  console.log(`Corrigé : assets/node_modules -> assets/${newDirName} (${patchedCount} fichier(s) JS/HTML mis à jour).`);
}

// Expo's static web export writes each route as a flat file (dist/login.html,
// dist/programs/[id].html, ...). Vercel only serves exact paths by default,
// so a direct visit, refresh, or PWA relaunch on any route other than "/"
// 404s even though in-app client-side navigation works fine.
//
// The "cleanUrls" shorthand looked like the fix, but on a plain static
// deploy (no framework) its internal fallback swallows the 404 itself and
// never falls through to a custom rewrite placed after it — "/login" would
// resolve, but the dynamic "/programs/:id" rewrite was silently never
// reached. Writing the routes explicitly avoids that: try real files first,
// resolve "/programs/:id" to its bracketed file, then fall back to
// appending ".html" for every other route.
function writeVercelConfig() {
  const config =
    JSON.stringify(
      {
        routes: [
          { handle: "filesystem" },
          { src: "^/programs/([^/]+)$", dest: "/programs/%5Bid%5D.html" },
          { src: "^/([^.]+)$", dest: "/$1.html", check: true },
        ],
      },
      null,
      2
    ) + "\n";

  // dist/vercel.json sert aux déploiements manuels (`vercel deploy` depuis dist/).
  // FrontEnd/vercel.json est celui lu par les builds Git de Vercel (projet dont le
  // Root Directory est FrontEnd) : il doit être versionné, car Vercel le lit avant
  // de lancer le build, donc trop tôt pour qu'il soit généré ici.
  fs.writeFileSync(path.join(distDir, "vercel.json"), config);
  fs.writeFileSync(path.join(__dirname, "..", "vercel.json"), config);
  console.log("Généré : dist/vercel.json et vercel.json (routage des URLs propres).");
}

fixFontPaths();
writeVercelConfig();
