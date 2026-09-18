import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type StreakBadgeProps = {
  currentStreak: number;
};

export default function StreakBadge({ currentStreak }: StreakBadgeProps) {
  if (currentStreak <= 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Commence ta série aujourd'hui !</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="flame" size={20} color="#ff7a00" />
      <Text style={styles.text}>
        {currentStreak} jour{currentStreak > 1 ? "s" : ""} consécutif{currentStreak > 1 ? "s" : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#fff2e6",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ff7a00",
  },
  emptyText: {
    fontSize: 13,
    color: "#999",
  },
});
