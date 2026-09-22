import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontFamily, Radius } from "@/theme";

type StreakBadgeProps = {
  currentStreak: number;
};

export default function StreakBadge({ currentStreak }: StreakBadgeProps) {
  if (currentStreak <= 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>Commence ta série aujourd'hui !</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="flame" size={18} color={Colors.flame} />
      <Text style={styles.text}>
        <Text style={styles.count}>{currentStreak}</Text> jour{currentStreak > 1 ? "s" : ""}{" "}
        consécutif{currentStreak > 1 ? "s" : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius,
    marginBottom: 16,
  },
  emptyContainer: {
    borderColor: Colors.line,
  },
  text: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.flame,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  count: {
    fontFamily: FontFamily.monoBold,
  },
  emptyText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.muted,
  },
});
