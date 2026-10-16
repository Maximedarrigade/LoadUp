import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { searchFoodByName, FoodResult } from "@/api/foodSearch";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius, AccentBorderWidth } from "@/theme";

export type PhotoItem = {
  key: string;
  /** Nom proposé par l'IA (ou saisi lors d'un ajout). */
  detectedName: string;
  grams: string;
  /** Produit Open Food Facts retenu pour les valeurs nutritionnelles. */
  food: FoodResult | null;
};

type Props = {
  items: PhotoItem[];
  onChange: (items: PhotoItem[]) => void;
  onValidate: () => void;
  onCancel: () => void;
  saving: boolean;
  remainingToday: number | null;
};

export function itemTotals(item: PhotoItem) {
  const grams = parseFloat(item.grams.replace(",", "."));
  if (!item.food || !(grams > 0)) return null;
  const f = grams / 100;
  return {
    grams,
    calories: item.food.caloriesPer100g * f,
    protein: item.food.proteinPer100g * f,
    carbs: (item.food.carbsPer100g ?? 0) * f,
    fat: (item.food.fatPer100g ?? 0) * f,
  };
}

let nextKey = 0;
export const newPhotoItemKey = () => `photo-${Date.now()}-${nextKey++}`;

/** Revue du résultat de l'analyse photo : l'utilisateur corrige tout avant enregistrement. */
export default function PhotoMealReview({ items, onChange, onValidate, onCancel, saving, remainingToday }: Props) {
  const [searchingKey, setSearchingKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  function update(key: string, patch: Partial<PhotoItem>) {
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function remove(key: string) {
    if (searchingKey === key) setSearchingKey(null);
    onChange(items.filter((item) => item.key !== key));
  }

  function openSearch(item: PhotoItem) {
    setSearchingKey(item.key);
    setQuery(item.detectedName);
    setResults([]);
    setSearchError("");
  }

  function addItem() {
    const item: PhotoItem = { key: newPhotoItemKey(), detectedName: "", grams: "100", food: null };
    onChange([...items, item]);
    openSearch(item);
  }

  async function runSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearchError("");
    try {
      const data = await searchFoodByName(query.trim());
      setResults(data.slice(0, 6));
      if (data.length === 0) setSearchError("Aucun résultat, essaie un autre nom.");
    } catch {
      setSearchError("Recherche impossible pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  function pick(food: FoodResult) {
    if (!searchingKey) return;
    const item = items.find((i) => i.key === searchingKey);
    update(searchingKey, { food, detectedName: item?.detectedName || food.name });
    setSearchingKey(null);
  }

  const totals = items.map(itemTotals);
  const sum = totals.reduce(
    (acc, t) =>
      t
        ? {
            calories: acc.calories + t.calories,
            protein: acc.protein + t.protein,
            carbs: acc.carbs + t.carbs,
            fat: acc.fat + t.fat,
          }
        : acc,
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const incomplete = items.some((_, i) => totals[i] === null);
  const canValidate = items.length > 0 && !incomplete && !saving;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Aliments détectés</Text>
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Estimation par IA à partir de ta photo : vérifie les aliments et ajuste les poids avant
          d'enregistrer. Les valeurs nutritionnelles viennent d'Open Food Facts.
        </Text>
        {remainingToday !== null ? (
          <Text style={styles.remainingText}>
            Analyses restantes aujourd'hui : <Text style={styles.mono}>{remainingToday}</Text>
          </Text>
        ) : null}
      </View>

      {items.map((item, index) => {
        const t = totals[index];
        return (
          <View key={item.key} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.detectedName || "Nouvel aliment"}
              </Text>
              <TouchableOpacity onPress={() => remove(item.key)} hitSlop={8} accessibilityLabel="Supprimer">
                <Ionicons name="trash" size={16} color={Colors.accent} />
              </TouchableOpacity>
            </View>

            {item.food ? (
              <Text style={styles.matchText} numberOfLines={2}>
                → {item.food.name} · {Math.round(item.food.caloriesPer100g)} kcal / 100 g
              </Text>
            ) : (
              <Text style={styles.noMatchText}>Aucune correspondance : choisis un aliment.</Text>
            )}

            <View style={styles.itemRow}>
              <TextInput
                style={styles.gramsInput}
                value={item.grams}
                onChangeText={(grams) => update(item.key, { grams })}
                keyboardType="numeric"
                maxLength={5}
                placeholderTextColor={Colors.muted}
              />
              <Text style={styles.gramsUnit}>g</Text>
              <Text style={styles.itemKcal}>{t ? `${Math.round(t.calories)} kcal` : "—"}</Text>
              <TouchableOpacity onPress={() => openSearch(item)}>
                <Text style={styles.changeLink}>{item.food ? "Changer" : "Choisir"}</Text>
              </TouchableOpacity>
            </View>

            {searchingKey === item.key ? (
              <View style={styles.searchBox}>
                <View style={styles.searchRow}>
                  <TextInput
                    style={[styles.searchInput, { flex: 1 }]}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={runSearch}
                    placeholder="Rechercher un aliment..."
                    placeholderTextColor={Colors.muted}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.searchButton} onPress={runSearch}>
                    <Text style={styles.searchButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
                {loading ? <ActivityIndicator color={Colors.accent} /> : null}
                {searchError ? <Text style={styles.noMatchText}>{searchError}</Text> : null}
                {results.map((food) => (
                  <TouchableOpacity key={food.id} style={styles.resultRow} onPress={() => pick(food)}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {food.name}
                    </Text>
                    <Text style={styles.resultMeta}>
                      {food.brand ? `${food.brand} — ` : ""}
                      {Math.round(food.caloriesPer100g)} kcal / 100 g
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setSearchingKey(null)}>
                  <Text style={styles.changeLink}>Fermer la recherche</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        );
      })}

      <TouchableOpacity style={styles.addButton} onPress={addItem}>
        <Text style={styles.addButtonText}>+ Ajouter un aliment</Text>
      </TouchableOpacity>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total estimé</Text>
        <Text style={styles.totalValue}>
          {Math.round(sum.calories)} kcal · P {Math.round(sum.protein)} g · G {Math.round(sum.carbs)} g · L{" "}
          {Math.round(sum.fat)} g
        </Text>
      </View>

      {incomplete ? (
        <Text style={styles.noMatchText}>
          Chaque aliment doit avoir une correspondance et un poids pour pouvoir enregistrer.
        </Text>
      ) : null}

      <View style={styles.actions}>
        <IronButton
          label="Valider et enregistrer"
          onPress={onValidate}
          disabled={!canValidate}
          loading={saving}
          style={{ flex: 1 }}
        />
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={saving}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  heading: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 18,
    textTransform: "uppercase",
    color: Colors.ink,
  },
  disclaimer: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.flame,
    borderRadius: Radius,
    padding: 12,
    gap: 6,
  },
  disclaimerText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.ink,
  },
  remainingText: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.muted,
  },
  mono: {
    fontFamily: FontFamily.monoBold,
    color: Colors.ink,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 12,
    gap: 6,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemName: {
    flex: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.ink,
    textTransform: "capitalize",
  },
  matchText: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    color: Colors.muted,
  },
  noMatchText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.flame,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gramsInput: {
    width: 72,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontFamily: FontFamily.monoBold,
    fontSize: 16,
    color: Colors.ink,
    backgroundColor: Colors.surface2,
    textAlign: "right",
  },
  gramsUnit: {
    fontFamily: FontFamily.mono,
    fontSize: 14,
    color: Colors.muted,
  },
  itemKcal: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: 13,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  changeLink: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  searchBox: {
    gap: 6,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: "row",
    gap: 6,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 8,
    fontFamily: FontFamily.body,
    fontSize: 15,
    color: Colors.ink,
    backgroundColor: Colors.surface2,
  },
  searchButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  searchButtonText: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.bg,
    fontSize: 13,
  },
  resultRow: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 8,
    backgroundColor: Colors.surface2,
  },
  resultName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  resultMeta: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: Colors.muted,
  },
  addButton: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderStyle: "dashed",
    borderRadius: Radius,
    padding: 10,
    alignItems: "center",
  },
  addButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  totalCard: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 12,
    gap: 2,
  },
  totalLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.muted,
    textTransform: "uppercase",
  },
  totalValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: 14,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: 16,
    borderRadius: Radius,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.ink,
  },
});
