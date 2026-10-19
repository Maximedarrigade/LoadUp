import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createHash } from "crypto";
import authRoutes from "./routes/auth.routes";
import programRoutes from "./routes/program.routes";
import programDayRoutes from "./routes/programDay.routes";
import programExerciseRoutes from "./routes/programExercise.routes";
import workoutLogRoutes from "./routes/workoutLog.routes";
import workoutSessionRoutes from "./routes/workoutSession.routes";
import streakRoutes from "./routes/streak.routes";
import exerciseLibraryRoutes from "./routes/exerciseLibrary.routes";
import nutritionProfileRoutes from "./routes/nutritionProfile.routes";
import foodSearchRoutes from "./routes/foodSearch.routes";
import mealRoutes from "./routes/meal.routes";
import workoutTemplateRoutes from "./routes/workoutTemplate.routes";

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.IP || "0.0.0.0";
const FRONTEND_URL = process.env.FRONTEND_URL;

// Middlewares
app.use(helmet());

// DIAGNOSTIC TEMPORAIRE (à retirer avant le merge) : structure des en-têtes posés par le
// proxy AlwaysData, pour choisir le réglage « trust proxy ». Ne s'active qu'avec l'en-tête
// x-loadup-diag (requêtes de test) et n'écrit aucune IP en clair : seulement une empreinte
// courte, sauf pour la plage de documentation 203.0.113.0/24 utilisée comme IP falsifiée.
function describeIp(raw: string | undefined) {
  if (!raw) return "absent";
  const ip = raw.trim().replace(/^::ffff:/, "");
  if (ip.startsWith("203.0.113.")) return `falsifiée(${ip})`;
  const kind = /^(127\.|::1$)/.test(ip)
    ? "loopback"
    : /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|f[cd])/i.test(ip)
      ? "privée"
      : "publique";
  return `${kind}:${createHash("sha256").update(ip).digest("hex").slice(0, 6)}`;
}
app.use((req, _res, next) => {
  const tag = req.get("x-loadup-diag");
  if (tag) {
    const xff = req.get("x-forwarded-for");
    const entries = xff ? xff.split(",").map(describeIp) : [];
    console.log(
      `[diag-proxy] test=${tag.slice(0, 20)} socket=${describeIp(req.socket.remoteAddress)} ` +
        `xff(${entries.length})=[${entries.join(" , ")}] x-real-ip=${describeIp(req.get("x-real-ip"))} ` +
        `forwarded=${req.get("forwarded") ? "présent" : "absent"} req.ip=${describeIp(req.ip)}`
    );
  }
  next();
});

// Les déploiements d'aperçu Vercel (branches, PR) ont une URL différente de la prod :
// loadup-muscu-<hash>-max-64e3.vercel.app ou loadup-muscu-git-<branche>-max-64e3.vercel.app.
// Le suffixe -max-64e3 (slug de l'équipe Vercel) empêche un tiers d'en créer de valides.
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/loadup-muscu-(git-[a-z0-9-]+|[a-z0-9]+)-max-64e3\.vercel\.app$/;

function isAllowedOrigin(origin: string) {
  return origin === FRONTEND_URL || VERCEL_PREVIEW_ORIGIN.test(origin);
}

app.use(
  cors(
    FRONTEND_URL
      ? {
          origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
        }
      : undefined
  )
);
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/programs", programRoutes);
app.use("/programs", programDayRoutes);
app.use("/days", programExerciseRoutes);
app.use("/exercises", workoutLogRoutes);
app.use("/sessions", workoutSessionRoutes);
app.use("/me", streakRoutes);
app.use("/exercise-library", exerciseLibraryRoutes);
app.use("/nutrition-profile", nutritionProfileRoutes);
app.use("/food-search", foodSearchRoutes);
app.use("/meals", mealRoutes);
app.use("/templates", workoutTemplateRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(Number(PORT), HOST, () => {
  console.log(`Serveur démarré sur http://${HOST}:${PORT}`);
});