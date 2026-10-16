import { View, Text, StyleSheet } from "react-native";
import { DayMeals } from "@/api/meals";
import { Goal } from "@/api/nutritionProfile";
import { Colors, FontFamily, Radius, AccentBorderWidth } from "@/theme";

export type MacroTotals = { calories: number; protein: number; carbs: number; fat: number };

type Props = {
  meal: MacroTotals;
  /** Journée relue après l'enregistrement : inclut déjà ce repas. */
  day: DayMeals;
  goal: Goal | null;
};

const percent = (value: number, target: number | null) =>
  target && target > 0 ? Math.round((value / target) * 100) : null;

/** Retour sobre après un repas : part des objectifs du jour et cohérence avec l'objectif. */
export default function MealGoalFeedback({ meal, day, goal }: Props) {
  if (day.targetCalories == null) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Repas enregistré</Text>
        <Text style={styles.text}>
          Configure ton profil nutritionnel pour voir la part de ce repas dans tes objectifs du jour.
        </Text>
      </View>
    );
  }

  const rows = [
    { label: "Calories", value: meal.calories, unit: "kcal", pct: percent(meal.calories, day.targetCalories) },
    { label: "Protéines", value: meal.protein, unit: "g", pct: percent(meal.protein, day.targetProtein) },
    { label: "Glucides", value: meal.carbs, unit: "g", pct: percent(meal.carbs, day.targetCarbs) },
    { label: "Lipides", value: meal.fat, unit: "g", pct: percent(meal.fat, day.targetFat) },
  ];

  const messages: string[] = [];
  const remaining = day.targetCalories - day.totalCalories;
  if (goal === "cut") {
    messages.push(
      remaining >= 0
        ? `Objectif perte de poids : il te reste ${remaining} kcal pour aujourd'hui.`
        : `Objectif perte de poids : avec ce repas, la journée dépasse l'objectif de ${-remaining} kcal.`
    );
  } else if (goal === "bulk") {
    messages.push(
      remaining > 0
        ? `Objectif prise de masse : encore ${remaining} kcal à consommer aujourd'hui pour atteindre l'objectif.`
        : "Objectif prise de masse : l'objectif calorique du jour est atteint."
    );
  }
  // Densité en protéines du repas comparée à celle visée sur la journée.
  const caloriesPct = rows[0].pct ?? 0;
  const proteinPct = rows[1].pct ?? 0;
  if (meal.calories > 0) {
    messages.push(
      proteinPct >= caloriesPct
        ? "Ce repas apporte une bonne part de protéines au regard de ses calories."
        : "Ce repas apporte peu de protéines au regard de ses calories : les prochains repas pourront compenser."
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ce repas dans ta journée</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>
            {Math.round(row.value)} {row.unit}
            {row.pct !== null ? <Text style={styles.pct}>  {row.pct} % du jour</Text> : null}
          </Text>
        </View>
      ))}
      {messages.map((message) => (
        <Text key={message} style={styles.text}>
          {message}
        </Text>
      ))}
      <Text style={styles.note}>Repères indicatifs, basés sur une estimation.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.accent,
    borderRadius: Radius,
    padding: 14,
    gap: 6,
  },
  title: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 16,
    textTransform: "uppercase",
    color: Colors.ink,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.muted,
  },
  value: {
    fontFamily: FontFamily.monoBold,
    fontSize: 14,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  pct: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    color: Colors.muted,
  },
  text: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.ink,
    marginTop: 2,
  },
  note: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.muted,
    fontStyle: "italic",
  },
});
