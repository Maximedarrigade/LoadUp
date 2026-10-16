import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, FontFamily } from "@/theme";
import { MIXED_FOODS_NOTE } from "@/constants/macroFoods";

type Props = {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  /** Exemples d'aliments ; si fourni, ajoute un accordéon « Où en trouver ? » (fermé par défaut). */
  foods?: readonly string[];
};

/** Barre de progression d'un macro : consommé du jour / cible, avec le reste à consommer. */
export default function MacroProgress({ label, consumed, target, unit, foods }: Props) {
  const [showFoods, setShowFoods] = useState(false);
  const ratio = target > 0 ? consumed / target : 0;
  const over = consumed > target;
  const remaining = Math.abs(target - consumed);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {consumed} <Text style={styles.target}>/ {target} {unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(ratio, 1) * 100}%`, backgroundColor: over ? Colors.flame : Colors.accent },
          ]}
        />
      </View>
      <View style={styles.row}>
        <Text style={[styles.remaining, over && { color: Colors.flame }]}>
          {over ? `+${remaining} ${unit} au-dessus` : `Reste ${remaining} ${unit}`}
        </Text>
        {foods ? (
          <TouchableOpacity onPress={() => setShowFoods((prev) => !prev)} hitSlop={8}>
            <Text style={styles.foodsToggle}>Où en trouver ? {showFoods ? "▴" : "▾"}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {foods && showFoods ? (
        <View style={styles.foodsBox}>
          <View style={styles.chips}>
            {foods.map((food) => (
              <Text key={food} style={styles.chip}>
                {food}
              </Text>
            ))}
          </View>
          <Text style={styles.mixedNote}>{MIXED_FOODS_NOTE}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.muted,
  },
  value: {
    fontFamily: FontFamily.monoBold,
    fontSize: 16,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  target: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
    color: Colors.muted,
  },
  track: {
    height: 6,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
  remaining: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: Colors.muted,
    fontVariant: ["tabular-nums"],
  },
  foodsToggle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.accent,
  },
  foodsBox: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 10,
    gap: 8,
    marginTop: 2,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mixedNote: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    color: Colors.muted,
    fontStyle: "italic",
  },
});
