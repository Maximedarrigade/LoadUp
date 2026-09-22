import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { createMeal, addMealIngredient } from "@/api/meals";
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
  const [manualWeight, setManualWeight] = useState("");

  const [scanning, setScanning] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [addedIngredients, setAddedIngredients] = useState<AddedIngredient[]>([]);

  const manualProteinRef = useRef<TextInput>(null);
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

    if (!manualName.trim() || !weight || isNaN(calories) || isNaN(protein)) {
      setError("Merci de remplir tous les champs de l'ajout manuel.");
      return;
    }

    try {
      const ingredient = await addMealIngredient(mealId, {
        name: manualName.trim(),
        weightInGrams: weight,
        caloriesPer100g: calories,
        proteinPer100g: protein,
      });
      setAddedIngredients((prev) => [
        ...prev,
        {
          id: ingredient.id,
          name: ingredient.name,
          weightInGrams: ingredient.weightInGrams,
          calories: ingredient.calories,
          protein: ingredient.protein,
        },
      ]);
      setManualName("");
      setManualCalories("");
      setManualProtein("");
      setManualWeight("");
      setShowManualForm(false);
      setError("");
    } catch (err) {
      setError("Erreur lors de l'ajout de l'ingrédient.");
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

      {addedIngredients.length > 0 ? (
        <View style={styles.addedList}>
          {addedIngredients.map((ing) => (
            <Text key={ing.id} style={styles.addedItem}>
              • {ing.name} ({ing.weightInGrams}g) — {Math.round(ing.calories)} kcal /{" "}
              {Math.round(ing.protein)} g
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
