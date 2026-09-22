import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getMealsByDate, deleteMeal, DayMeals } from "@/api/meals";
import { Colors, FontFamily, Radius, AccentBorderWidth } from "@/theme";

export default function NutritionScreen() {
  const [data, setData] = useState<DayMeals | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await getMealsByDate();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleDeleteMeal(mealId: string) {
    try {
      await deleteMeal(mealId);
      setConfirmingId(null);
      load();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const hasProfile = data?.targetCalories != null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition</Text>

      {hasProfile ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Calories</Text>
            <Text style={styles.summaryValue}>
              {data!.totalCalories} / {data!.targetCalories} kcal
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Protéines</Text>
            <Text style={styles.summaryValue}>
              {data!.totalProtein} / {data!.targetProtein} g
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/nutrition-profile")}>
            <Text style={styles.editProfileLink}>Modifier mon profil →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.setupCard}
          onPress={() => router.push("/nutrition-profile")}
        >
          <Text style={styles.setupCardText}>
            Configure ton profil pour connaître tes objectifs caloriques →
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create-meal")}>
        <Text style={styles.addButtonText}>+ Nouveau repas</Text>
      </TouchableOpacity>

      <FlatList
        data={data?.meals ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, marginTop: 16, paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>Aucun repas enregistré aujourd'hui.</Text>}
        renderItem={({ item: meal }) => (
          <View style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealTotals}>
                  {meal.totalCalories} kcal — {meal.totalProtein} g protéines
                </Text>
              </View>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setConfirmingId(meal.id)}
              >
                <Ionicons name="trash" size={18} color={Colors.accent} />
              </TouchableOpacity>
            </View>

            {confirmingId === meal.id ? (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmText}>Supprimer "{meal.name}" ?</Text>
                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setConfirmingId(null)}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => handleDeleteMeal(meal.id)}
                  >
                    <Text style={styles.confirmButtonText}>Confirmer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              meal.ingredients.map((ingredient) => (
                <Text key={ingredient.id} style={styles.ingredientText}>
                  • {ingredient.name} ({ingredient.weightInGrams}g)
                </Text>
              ))
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 24,
    backgroundColor: Colors.bg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bg,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    textTransform: "uppercase",
    color: Colors.ink,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.muted,
  },
  summaryValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: 16,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  editProfileLink: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.accent,
    marginTop: 4,
  },
  setupCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.flame,
    borderRadius: Radius,
    padding: 16,
  },
  setupCardText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.flame,
  },
  addButton: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 12,
    borderRadius: Radius,
    alignItems: "center",
    marginTop: 16,
  },
  addButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.ink,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  mealCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.accent,
    borderRadius: Radius,
    padding: 14,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  mealName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.ink,
  },
  mealTotals: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  iconButton: {
    padding: 6,
    borderRadius: Radius,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  ingredientText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.muted,
    marginTop: 6,
  },
  confirmBox: {
    marginTop: 10,
  },
  confirmText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 8,
    borderRadius: Radius,
    alignItems: "center",
  },
  cancelButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.ink,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    padding: 8,
    borderRadius: Radius,
    alignItems: "center",
  },
  confirmButtonText: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.bg,
    fontSize: 13,
  },
  empty: {
    fontFamily: FontFamily.body,
    textAlign: "center",
    color: Colors.muted,
    marginTop: 20,
  },
});
