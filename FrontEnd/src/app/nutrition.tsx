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
        <ActivityIndicator size="large" />
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
        contentContainerStyle={{ gap: 12, marginTop: 16 }}
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
                <Ionicons name="trash" size={18} color="#cc0000" />
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
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  editProfileLink: {
    fontSize: 13,
    color: "#0066cc",
    fontWeight: "600",
    marginTop: 4,
  },
  setupCard: {
    backgroundColor: "#fff2e6",
    borderRadius: 12,
    padding: 16,
  },
  setupCardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ff7a00",
  },
  addButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  mealCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 14,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
  },
  mealTotals: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  iconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  ingredientText: {
    fontSize: 13,
    color: "#444",
    marginTop: 6,
  },
  confirmBox: {
    marginTop: 10,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#cc0000",
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelButtonText: {
    fontWeight: "600",
    fontSize: 13,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#cc0000",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  empty: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
});
