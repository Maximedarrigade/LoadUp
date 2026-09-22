import { Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp, ActivityIndicator } from "react-native";
import { Colors, FontFamily, Radius } from "@/theme";

type IronButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline";
  style?: StyleProp<ViewStyle>;
};

/** Bouton primaire Iron Log : fond --accent, texte --bg, majuscules, letter-spacing léger. */
export default function IronButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  style,
}: IronButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === "primary" ? styles.primary : styles.outline,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? Colors.bg : Colors.accent} />
      ) : (
        <Text style={[styles.text, variant === "primary" ? styles.primaryText : styles.outlineText]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: Colors.accent,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.line,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 15,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  primaryText: {
    color: Colors.bg,
  },
  outlineText: {
    color: Colors.ink,
  },
});
