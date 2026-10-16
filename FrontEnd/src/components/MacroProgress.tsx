import { View, Text, StyleSheet } from "react-native";
import { Colors, FontFamily } from "@/theme";

type Props = {
  label: string;
  consumed: number;
  target: number;
  unit: string;
};

/** Barre de progression d'un macro : consommé du jour / cible, avec le reste à consommer. */
export default function MacroProgress({ label, consumed, target, unit }: Props) {
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
      <Text style={[styles.remaining, over && { color: Colors.flame }]}>
        {over ? `+${remaining} ${unit} au-dessus` : `Reste ${remaining} ${unit}`}
      </Text>
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
});
