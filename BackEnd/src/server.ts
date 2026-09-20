import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import programRoutes from "./routes/program.routes";
import programDayRoutes from "./routes/programDay.routes";
import programExerciseRoutes from "./routes/programExercise.routes";
import workoutLogRoutes from "./routes/workoutLog.routes";
import streakRoutes from "./routes/streak.routes";
import exerciseLibraryRoutes from "./routes/exerciseLibrary.routes";
import nutritionProfileRoutes from "./routes/nutritionProfile.routes";
import foodSearchRoutes from "./routes/foodSearch.routes";
import mealRoutes from "./routes/meal.routes";

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.IP || "0.0.0.0";
const FRONTEND_URL = process.env.FRONTEND_URL;

// Middlewares
app.use(helmet());

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
app.use("/me", streakRoutes);
app.use("/exercise-library", exerciseLibraryRoutes);
app.use("/nutrition-profile", nutritionProfileRoutes);
app.use("/food-search", foodSearchRoutes);
app.use("/meals", mealRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(Number(PORT), HOST, () => {
  console.log(`Serveur démarré sur http://${HOST}:${PORT}`);
});