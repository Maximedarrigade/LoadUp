import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { SetFeeling } from "@/api/workouts";
import { Colors, FontFamily, Radius } from "@/theme";

type FeelingSelectorProps = {
  value: SetFeeling | null;
  onChange: (feeling: SetFeeling) => void;
};

const OPTIONS: { value: SetFeeling; label: string; level: number; color: string }[] = [
  { value: "easy", label: "Facile", level: 1, color: Colors.flame },
  { value: "normal", label: "Normal", level: 2, color: Colors.ink },
  { value: "hard", label: "Difficile", level: 3, color: Colors.accent },
];

const BAR_HEIGHTS = [8, 14, 20];

/** Baromètre de ressenti à 3 crans : des barres de plus en plus hautes, de Facile à Difficile. */
export default function FeelingSelector({ value, onChange }: FeelingSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ressenti</Text>
      <View style={styles.row}>
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, selected && { borderColor: option.color }]}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              activeOpacity={0.85}
            >
              <View style={styles.bars}>
                {BAR_HEIGHTS.map((height, index) => (
                  <View
                    key={height}
                    style={[
                      styles.bar,
                      { height },
                      index < option.level && {
                        backgroundColor: selected ? option.color : Colors.muted,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.optionText, selected && { color: option.color }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    gap: 6,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.muted,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 20,
  },
  bar: {
    width: 6,
    borderRadius: 1,
    backgroundColor: Colors.line,
  },
  optionText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: Colors.muted,
  },
});
