import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { createMeal, addMealIngredient, getMealsByDate, DayMeals } from "@/api/meals";
import { getNutritionProfile, Goal } from "@/api/nutritionProfile";
import { analyzeMealPhoto, photoErrorMessage } from "@/api/photoAnalysis";
import { pickPhoto, compressPhoto } from "@/utils/photo";
import { takePendingPhoto } from "@/store/pendingPhoto";
import PhotoMealReview, { PhotoItem, itemTotals, newPhotoItemKey } from "@/components/PhotoMealReview";
import MealGoalFeedback, { MacroTotals } from "@/components/MealGoalFeedback";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius, AccentBorderWidth } from "@/theme";

type Step = "idle" | "analyzing" | "review" | "saved";

const USER_DAILY_LIMIT = 5;

function sumItems(items: PhotoItem[]): MacroTotals {
  return items.reduce<MacroTotals>(
    (acc, item) => {
      const t = itemTotals(item);
      return t
        ? {
            calories: acc.calories + t.calories,
            protein: acc.protein + t.protein,
            carbs: acc.carbs + t.carbs,
            fat: acc.fat + t.fat,
          }
        : acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/** Journée telle qu'elle serait avec ce repas en plus (aperçu avant enregistrement). */
function projectDay(day: DayMeals, meal: MacroTotals): DayMeals {
  return {
    ...day,
    totalCalories: day.totalCalories + Math.round(meal.calories),
    totalProtein: day.totalProtein + Math.round(meal.protein),
    totalCarbs: day.totalCarbs + Math.round(meal.carbs),
    totalFat: day.totalFat + Math.round(meal.fat),
  };
}

function leaveScreen() {
  if (router.canGoBack()) router.back();
  else router.replace("/nutrition");
}

/**
 * Analyse directe d'une assiette (bouton « Scanner mon assiette ») : résultat, part des objectifs
 * du jour, puis « Enregistrer comme repas » ou « Fermer sans enregistrer ».
 */
export default function ScanMealScreen() {
  const [step, setStep] = useState<Step>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [day, setDay] = useState<DayMeals | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [mealName, setMealName] = useState("");
  const [saving, setSaving] = useState(false);
  // Repas déjà créé si un enregistrement a échoué en cours de route : on y ajoute le reste.
  const [mealId, setMealId] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<{ meal: MacroTotals; day: DayMeals } | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (step !== "analyzing") return;
    setSeconds(0);
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [step]);

  async function analyze(file: File) {
    setError("");
    setStep("analyzing");
    let photo: Blob;
    try {
      photo = await compressPhoto(file);
    } catch {
      setError("Impossible de lire cette photo. Essaie d'en prendre une autre.");
      setStep("idle");
      return;
    }
    try {
      const [result, dayData, profileGoal] = await Promise.all([
        analyzeMealPhoto(photo),
        getMealsByDate().catch(() => null),
        getNutritionProfile()
          .then((p) => p.goal)
          .catch(() => null),
      ]);
      setRemainingToday(result.remainingToday);
      setDay(dayData);
      setGoal(profileGoal);
      setItems(
        result.foods.map((food) => ({
          key: newPhotoItemKey(),
          detectedName: food.name,
          grams: String(food.estimatedGrams),
          food: food.match,
        }))
      );
      setStep("review");
    } catch (err: any) {
      const remaining = err?.response?.data?.remainingToday;
      if (typeof remaining === "number") setRemainingToday(remaining);
      setError(photoErrorMessage(err));
      setStep("idle");
    }
  }

  // Photo prise depuis le bouton de l'écran précédent : analyse immédiate.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const file = takePendingPhoto();
    if (file) analyze(file);
  }, []);

  async function handleRetake() {
    const file = await pickPhoto();
    if (file) analyze(file);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    let id = mealId;
    let remaining = items;
    try {
      if (!id) {
        const meal = await createMeal(mealName.trim());
        id = meal.id;
        setMealId(meal.id);
      }
      for (const item of items) {
        const t = itemTotals(item);
        if (!t || !item.food) continue;
        await addMealIngredient(id, {
          name: item.food.name,
          weightInGrams: t.grams,
          caloriesPer100g: item.food.caloriesPer100g,
          proteinPer100g: item.food.proteinPer100g,
          carbsPer100g: item.food.carbsPer100g,
          fatPer100g: item.food.fatPer100g,
          openFoodFactsId: item.food.id,
        });
        remaining = remaining.filter((r) => r.key !== item.key);
      }
    } catch (err: any) {
      setItems(remaining);
      setError(
        err?.response?.data?.error ||
          "Certains aliments n'ont pas pu être enregistrés. Réessaie : ceux déjà enregistrés ne seront pas dupliqués."
      );
      setSaving(false);
      return;
    }

    // Totaux relus côté serveur : justes même si l'enregistrement s'est fait en deux fois.
    const estimate = sumItems(items);
    try {
      const fresh = await getMealsByDate();
      const saved = fresh.meals.find((m) => m.id === id);
      const meal = saved
        ? { calories: saved.totalCalories, protein: saved.totalProtein, carbs: saved.totalCarbs, fat: saved.totalFat }
        : estimate;
      setSavedFeedback({ meal, day: fresh });
    } catch {
      setSavedFeedback(day ? { meal: estimate, day: projectDay(day, estimate) } : null);
    }
    setSaving(false);
    setStep("saved");
  }

  const limitNotice =
    remainingToday !== null ? (
      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          Cette analyse compte dans ta limite de {USER_DAILY_LIMIT} par jour, que tu enregistres le
          repas ou non. Il t'en reste <Text style={styles.mono}>{remainingToday}</Text> aujourd'hui.
        </Text>
      </View>
    ) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Scanner mon assiette</Text>

      {step === "analyzing" ? (
        <View style={styles.analyzingBox}>
          <ActivityIndicator color={Colors.accent} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.analyzingText}>
              {seconds < 15
                ? "Analyse de la photo en cours…"
                : seconds < 40
                  ? "L'IA prend son temps, encore un instant…"
                  : "La réponse tarde, on attend encore un peu…"}
            </Text>
            <Text style={styles.hint}>
              <Text style={styles.mono}>{seconds} s</Text> · garde l'appli ouverte pendant l'analyse
            </Text>
          </View>
        </View>
      ) : null}

      {step === "idle" ? (
        <View style={styles.block}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!error ? (
            <Text style={styles.hint}>
              Prends ton assiette en photo, bien visible et éclairée : l'IA estime les aliments et leurs
              poids, tu vérifies, puis tu choisis de l'enregistrer ou non.
            </Text>
          ) : null}
          {limitNotice}
          <IronButton
            label={error ? "Réessayer avec une photo" : "Prendre une photo"}
            onPress={handleRetake}
            disabled={remainingToday === 0}
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={leaveScreen}>
            <Text style={styles.secondaryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {step === "review" ? (
        <View style={styles.block}>
          {limitNotice}
          {day ? (
            <MealGoalFeedback
              meal={sumItems(items)}
              day={projectDay(day, sumItems(items))}
              goal={goal}
              title="Si tu enregistres ce repas"
            />
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Nom du repas (facultatif, ex : Déjeuner)"
            value={mealName}
            onChangeText={setMealName}
            placeholderTextColor={Colors.muted}
            maxLength={100}
          />
          <PhotoMealReview
            items={items}
            onChange={setItems}
            onValidate={handleSave}
            onCancel={leaveScreen}
            saving={saving}
            remainingToday={null}
            validateLabel="Enregistrer comme repas"
            cancelLabel="Fermer sans enregistrer"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : null}

      {step === "saved" ? (
        <View style={styles.block}>
          <Text style={styles.savedText}>Repas enregistré.</Text>
          {savedFeedback ? <MealGoalFeedback meal={savedFeedback.meal} day={savedFeedback.day} goal={goal} /> : null}
          <IronButton label="Voir ma journée" onPress={() => router.replace("/nutrition")} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    textTransform: "uppercase",
    color: Colors.ink,
  },
  block: {
    gap: 12,
  },
  analyzingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 14,
  },
  analyzingText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.ink,
  },
  hint: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.muted,
  },
  mono: {
    fontFamily: FontFamily.monoBold,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  limitCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.flame,
    borderRadius: Radius,
    padding: 12,
  },
  limitText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.ink,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 12,
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: Colors.ink,
    backgroundColor: Colors.surface,
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.flame,
  },
  secondaryButton: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 12,
    borderRadius: Radius,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  savedText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.ink,
  },
});
