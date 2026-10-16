import { ComponentProps, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { createMeal, addMealIngredient, getMealsByDate } from "@/api/meals";
import { getNutritionProfile } from "@/api/nutritionProfile";
import { analyzeMealPhoto, photoErrorMessage } from "@/api/photoAnalysis";
import { pickPhoto, compressPhoto } from "@/utils/photo";
import PhotoMealReview, { PhotoItem, itemTotals, newPhotoItemKey } from "@/components/PhotoMealReview";
import MealGoalFeedback, { MacroTotals } from "@/components/MealGoalFeedback";
import { searchFoodByName, searchFoodByBarcode, FoodResult } from "@/api/foodSearch";
import DismissKeyboardView from "@/components/DismissKeyboardView";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius, AccentBorderWidth } from "@/theme";

type AddedIngredient = {
  id: string;
  name: string;
  weightInGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export default function CreateMealScreen() {
  const [mealId, setMealId] = useState<string | null>(null);
  const [mealName, setMealName] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FoodResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
  const [portionWeight, setPortionWeight] = useState("");

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [manualWeight, setManualWeight] = useState("");

  const [scanning, setScanning] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [addedIngredients, setAddedIngredients] = useState<AddedIngredient[]>([]);

  // Analyse photo (PWA uniquement) : rien n'est enregistré avant la validation.
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [analysisSeconds, setAnalysisSeconds] = useState(0);
  const [photoError, setPhotoError] = useState("");
  const [photoItems, setPhotoItems] = useState<PhotoItem[] | null>(null);
  const [photoRemaining, setPhotoRemaining] = useState<number | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<ComponentProps<typeof MealGoalFeedback> | null>(null);

  const manualProteinRef = useRef<TextInput>(null);
  // Compteur affiché pendant l'analyse, qui peut durer plusieurs dizaines de secondes.
  useEffect(() => {
    if (!analyzingPhoto) return;
    setAnalysisSeconds(0);
    const timer = setInterval(() => setAnalysisSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [analyzingPhoto]);

  const manualCarbsRef = useRef<TextInput>(null);
  const manualFatRef = useRef<TextInput>(null);
  const manualWeightRef = useRef<TextInput>(null);

  async function handleCreateMeal() {
    try {
      const meal = await createMeal(mealName);
      setMealId(meal.id);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erreur lors de la création du repas.");
    }
  }

  async function handleSearch() {
    if (!search.trim()) return;
    setSearching(true);
    setSelectedFood(null);
    try {
      const data = await searchFoodByName(search.trim());
      setResults(data);
    } catch (err) {
      setError("Erreur lors de la recherche d'aliment.");
    } finally {
      setSearching(false);
    }
  }

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scanLocked) return;
    setScanLocked(true);
    setScanning(false);
    try {
      const food = await searchFoodByBarcode(data);
      if (food) {
        setSelectedFood(food);
        setResults([]);
      } else {
        setError("Produit introuvable pour ce code-barres. Essaie la recherche par nom.");
      }
    } catch (err) {
      setError("Erreur lors du scan du code-barres.");
    } finally {
      setScanLocked(false);
    }
  }

  async function handleAddSelectedFood() {
    if (!mealId || !selectedFood) return;
    const weight = parseFloat(portionWeight);
    if (!weight) {
      setError("Merci d'indiquer le poids de la portion.");
      return;
    }

    try {
      const ingredient = await addMealIngredient(mealId, {
        name: selectedFood.name,
        weightInGrams: weight,
        caloriesPer100g: selectedFood.caloriesPer100g,
        proteinPer100g: selectedFood.proteinPer100g,
        carbsPer100g: selectedFood.carbsPer100g,
        fatPer100g: selectedFood.fatPer100g,
        openFoodFactsId: selectedFood.id,
      });
      setAddedIngredients((prev) => [
        ...prev,
        {
          id: ingredient.id,
          name: ingredient.name,
          weightInGrams: ingredient.weightInGrams,
          calories: ingredient.calories,
          protein: ingredient.protein,
          carbs: ingredient.carbs,
          fat: ingredient.fat,
        },
      ]);
      setSelectedFood(null);
      setPortionWeight("");
      setResults([]);
      setSearch("");
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erreur lors de l'ajout de l'ingrédient.");
    }
  }

  async function handleAddManualIngredient() {
    if (!mealId) return;
    const weight = parseFloat(manualWeight);
    const calories = parseFloat(manualCalories);
    const protein = parseFloat(manualProtein);
    // Glucides et lipides facultatifs : champ vide = non renseigné.
    const carbs = manualCarbs.trim() ? parseFloat(manualCarbs) : null;
    const fat = manualFat.trim() ? parseFloat(manualFat) : null;

    if (!manualName.trim() || !weight || isNaN(calories) || isNaN(protein)) {
      setError("Merci de remplir le nom, les calories, les protéines et le poids.");
      return;
    }
    if ((carbs !== null && isNaN(carbs)) || (fat !== null && isNaN(fat))) {
      setError("Glucides et lipides doivent être des nombres (ou laissés vides).");
      return;
    }

    try {
      const ingredient = await addMealIngredient(mealId, {
        name: manualName.trim(),
        weightInGrams: weight,
        caloriesPer100g: calories,
        proteinPer100g: protein,
        carbsPer100g: carbs,
        fatPer100g: fat,
      });
      setAddedIngredients((prev) => [
        ...prev,
        {
          id: ingredient.id,
          name: ingredient.name,
          weightInGrams: ingredient.weightInGrams,
          calories: ingredient.calories,
          protein: ingredient.protein,
          carbs: ingredient.carbs,
          fat: ingredient.fat,
        },
      ]);
      setManualName("");
      setManualCalories("");
      setManualProtein("");
      setManualCarbs("");
      setManualFat("");
      setManualWeight("");
      setShowManualForm(false);
      setError("");
    } catch (err) {
      setError("Erreur lors de l'ajout de l'ingrédient.");
    }
  }

  async function handleTakePhoto() {
    setPhotoError("");
    setFeedback(null);
    const file = await pickPhoto();
    if (!file) return;

    setAnalyzingPhoto(true);
    try {
      let photo: Blob;
      try {
        photo = await compressPhoto(file);
      } catch {
        setPhotoError("Impossible de lire cette photo. Essaie d'en prendre une autre.");
        return;
      }
      const result = await analyzeMealPhoto(photo);
      setPhotoRemaining(result.remainingToday);
      setPhotoItems(
        result.foods.map((food) => ({
          key: newPhotoItemKey(),
          detectedName: food.name,
          grams: String(food.estimatedGrams),
          food: food.match,
        }))
      );
    } catch (err: any) {
      const remaining = err?.response?.data?.remainingToday;
      if (typeof remaining === "number") setPhotoRemaining(remaining);
      setPhotoError(photoErrorMessage(err));
    } finally {
      setAnalyzingPhoto(false);
    }
  }

  async function handleValidatePhoto() {
    if (!photoItems) return;
    setSavingPhoto(true);
    setPhotoError("");

    let id = mealId;
    const saved: AddedIngredient[] = [];
    const mealTotals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let remaining = photoItems;
    try {
      if (!id) {
        const meal = await createMeal(mealName);
        id = meal.id;
        setMealId(meal.id);
      }
      for (const item of photoItems) {
        const t = itemTotals(item);
        if (!t || !item.food) continue;
        const ingredient = await addMealIngredient(id, {
          name: item.food.name,
          weightInGrams: t.grams,
          caloriesPer100g: item.food.caloriesPer100g,
          proteinPer100g: item.food.proteinPer100g,
          carbsPer100g: item.food.carbsPer100g,
          fatPer100g: item.food.fatPer100g,
          openFoodFactsId: item.food.id,
        });
        saved.push({
          id: ingredient.id,
          name: ingredient.name,
          weightInGrams: ingredient.weightInGrams,
          calories: ingredient.calories,
          protein: ingredient.protein,
          carbs: ingredient.carbs,
          fat: ingredient.fat,
        });
        mealTotals.calories += ingredient.calories;
        mealTotals.protein += ingredient.protein;
        mealTotals.carbs += ingredient.carbs;
        mealTotals.fat += ingredient.fat;
        remaining = remaining.filter((r) => r.key !== item.key);
      }
    } catch (err: any) {
      // Les aliments déjà enregistrés le restent ; on garde les autres à l'écran pour réessayer.
      setAddedIngredients((prev) => [...prev, ...saved]);
      setPhotoItems(remaining);
      setPhotoError(
        err?.response?.data?.error || "Certains aliments n'ont pas pu être enregistrés. Réessaie."
      );
      setSavingPhoto(false);
      return;
    }

    setAddedIngredients((prev) => [...prev, ...saved]);
    setPhotoItems(null);
    setSavingPhoto(false);
    try {
      const [day, goal] = await Promise.all([
        getMealsByDate(),
        getNutritionProfile()
          .then((profile) => profile.goal)
          .catch(() => null),
      ]);
      setFeedback({ meal: mealTotals, day, goal });
    } catch (err) {
      console.error(err);
    }
  }

  function handleFinish() {
    router.replace("/nutrition");
  }

  async function handleOpenScanner() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setError("Permission caméra refusée.");
        return;
      }
    }
    setScanning(true);
  }

  const photoSection =
    Platform.OS === "web" ? (
      <View style={styles.photoSection}>
        <TouchableOpacity
          style={[styles.photoButton, analyzingPhoto && styles.photoButtonDisabled]}
          onPress={handleTakePhoto}
          disabled={analyzingPhoto}
        >
          <Text style={styles.photoButtonText}>📸 Photographier mon assiette</Text>
        </TouchableOpacity>
        {analyzingPhoto ? (
          <View style={styles.analyzingBox}>
            <ActivityIndicator color={Colors.accent} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.analyzingText}>
                {analysisSeconds < 15
                  ? "Analyse de la photo en cours…"
                  : analysisSeconds < 40
                    ? "L'IA prend son temps, encore un instant…"
                    : "La réponse tarde, on attend encore un peu…"}
              </Text>
              <Text style={styles.analyzingHint}>
                <Text style={styles.analyzingSeconds}>{analysisSeconds} s</Text> · garde l'appli
                ouverte pendant l'analyse
              </Text>
            </View>
          </View>
        ) : null}
        {photoError ? <Text style={styles.photoError}>{photoError}</Text> : null}
      </View>
    ) : null;

  if (photoItems) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{mealName || "Nouveau repas"}</Text>
        <PhotoMealReview
          items={photoItems}
          onChange={setPhotoItems}
          onValidate={handleValidatePhoto}
          onCancel={() => {
            setPhotoItems(null);
            setPhotoError("");
          }}
          saving={savingPhoto}
          remainingToday={photoRemaining}
        />
        {photoError ? <Text style={styles.photoError}>{photoError}</Text> : null}
      </ScrollView>
    );
  }

  if (!mealId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Nouveau repas</Text>
        <TextInput
          style={styles.input}
          placeholder="Nom du repas (ex: Déjeuner)"
          value={mealName}
          onChangeText={setMealName}
          placeholderTextColor={Colors.muted}
          maxLength={100}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <IronButton label="Créer le repas" onPress={handleCreateMeal} />
        {photoSection}
      </View>
    );
  }

  if (scanning) {
    return (
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a"] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <TouchableOpacity style={styles.cancelScanButton} onPress={() => setScanning(false)}>
          <Text style={styles.cancelScanButtonText}>Annuler le scan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <DismissKeyboardView style={styles.container}>
      <Text style={styles.title}>{mealName || "Nouveau repas"}</Text>

      {feedback ? <MealGoalFeedback {...feedback} /> : null}

      {addedIngredients.length > 0 ? (
        <View style={styles.addedList}>
          {addedIngredients.map((ing) => (
            <Text key={ing.id} style={styles.addedItem}>
              • {ing.name} ({ing.weightInGrams}g) — {Math.round(ing.calories)} kcal · P{" "}
              {Math.round(ing.protein)} g · G {Math.round(ing.carbs)} g · L {Math.round(ing.fat)} g
            </Text>
          ))}
        </View>
      ) : null}

      {selectedFood ? (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedName}>{selectedFood.name}</Text>
          <Text style={styles.selectedMeta}>
            {selectedFood.caloriesPer100g} kcal / {selectedFood.proteinPer100g} g protéines pour
            100g
          </Text>
          <TextInput
            style={[styles.input, styles.numericInput]}
            placeholder="Poids de la portion (g)"
            value={portionWeight}
            onChangeText={setPortionWeight}
            keyboardType="numeric"
            placeholderTextColor={Colors.muted}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <View style={styles.row}>
            <IronButton
              label="Ajouter au repas"
              onPress={handleAddSelectedFood}
              style={{ flex: 1 }}
            />
            <TouchableOpacity
              style={[styles.cancelButton, styles.flexButton]}
              onPress={() => setSelectedFood(null)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Rechercher un aliment..."
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              placeholderTextColor={Colors.muted}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Chercher</Text>
            </TouchableOpacity>
          </View>

          {photoSection}

          {Platform.OS !== "web" ? (
            <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner}>
              <Text style={styles.scanButtonText}>📷 Scanner un code-barres</Text>
            </TouchableOpacity>
          ) : null}

          {searching ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: 12 }} />
          ) : null}

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 8, marginTop: 12 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultCard} onPress={() => setSelectedFood(item)}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultMeta}>
                  {item.brand ? `${item.brand} — ` : ""}
                  {item.caloriesPer100g} kcal / {item.proteinPer100g} g pour 100g
                </Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={styles.manualToggle}
            onPress={() => setShowManualForm((prev) => !prev)}
          >
            <Text style={styles.manualToggleText}>
              {showManualForm ? "Annuler la saisie manuelle" : "Aliment introuvable ? Saisie manuelle"}
            </Text>
          </TouchableOpacity>

          {showManualForm ? (
            <View style={styles.manualForm}>
              <TextInput
                style={styles.input}
                placeholder="Nom de l'aliment"
                value={manualName}
                onChangeText={setManualName}
                placeholderTextColor={Colors.muted}
                maxLength={150}
              />
              <TextInput
                style={[styles.input, styles.numericInput]}
                placeholder="Calories / 100g"
                value={manualCalories}
                onChangeText={setManualCalories}
                keyboardType="numeric"
                placeholderTextColor={Colors.muted}
                returnKeyType="next"
                onSubmitEditing={() => manualProteinRef.current?.focus()}
              />
              <TextInput
                ref={manualProteinRef}
                style={[styles.input, styles.numericInput]}
                placeholder="Protéines / 100g"
                value={manualProtein}
                onChangeText={setManualProtein}
                keyboardType="numeric"
                placeholderTextColor={Colors.muted}
                returnKeyType="next"
                onSubmitEditing={() => manualCarbsRef.current?.focus()}
              />
              <TextInput
                ref={manualCarbsRef}
                style={[styles.input, styles.numericInput]}
                placeholder="Glucides / 100g (facultatif)"
                value={manualCarbs}
                onChangeText={setManualCarbs}
                keyboardType="numeric"
                placeholderTextColor={Colors.muted}
                returnKeyType="next"
                onSubmitEditing={() => manualFatRef.current?.focus()}
              />
              <TextInput
                ref={manualFatRef}
                style={[styles.input, styles.numericInput]}
                placeholder="Lipides / 100g (facultatif)"
                value={manualFat}
                onChangeText={setManualFat}
                keyboardType="numeric"
                placeholderTextColor={Colors.muted}
                returnKeyType="next"
                onSubmitEditing={() => manualWeightRef.current?.focus()}
              />
              <TextInput
                ref={manualWeightRef}
                style={[styles.input, styles.numericInput]}
                placeholder="Poids de la portion (g)"
                value={manualWeight}
                onChangeText={setManualWeight}
                keyboardType="numeric"
                placeholderTextColor={Colors.muted}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              <IronButton label="Ajouter au repas" onPress={handleAddManualIngredient} />
            </View>
          ) : null}
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
        <Text style={styles.finishButtonText}>Terminer le repas</Text>
      </TouchableOpacity>
    </DismissKeyboardView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 24,
    gap: 10,
    backgroundColor: Colors.bg,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    textTransform: "uppercase",
    color: Colors.ink,
    marginBottom: 8,
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
  numericInput: {
    fontFamily: FontFamily.mono,
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Colors.accent,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  flexButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 14,
    borderRadius: Radius,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchButtonText: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.bg,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  scanButton: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 12,
    borderRadius: Radius,
    alignItems: "center",
  },
  scanButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 12,
  },
  resultName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  resultMeta: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  selectedCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.accent,
    borderRadius: Radius,
    padding: 14,
    gap: 10,
  },
  selectedName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 16,
    color: Colors.ink,
  },
  selectedMeta: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
    color: Colors.muted,
  },
  manualToggle: {
    marginTop: 8,
    alignItems: "center",
  },
  manualToggleText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  manualForm: {
    gap: 8,
    marginTop: 8,
  },
  addedList: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 12,
    gap: 4,
  },
  addedItem: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
    color: Colors.muted,
  },
  camera: {
    flex: 1,
    borderRadius: Radius,
  },
  cancelScanButton: {
    backgroundColor: Colors.accent,
    padding: 14,
    borderRadius: Radius,
    alignItems: "center",
    marginTop: 12,
  },
  cancelScanButtonText: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.bg,
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 10,
  },
  photoSection: {
    gap: 8,
  },
  photoButton: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.accent,
    padding: 12,
    borderRadius: Radius,
    alignItems: "center",
  },
  photoButtonDisabled: {
    opacity: 0.5,
  },
  photoButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  analyzingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 12,
  },
  analyzingText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.ink,
  },
  analyzingHint: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.muted,
  },
  analyzingSeconds: {
    fontFamily: FontFamily.monoBold,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  photoError: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.flame,
    textAlign: "center",
  },
  finishButton: {
    backgroundColor: Colors.flame,
    padding: 14,
    borderRadius: Radius,
    alignItems: "center",
    marginTop: 12,
  },
  finishButtonText: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.bg,
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});
