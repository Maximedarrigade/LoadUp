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

// Middlewares
app.use(helmet());
app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});