import { View, Text, StyleSheet } from "react-native";
import { Colors, FontFamily } from "@/theme";

type SectionLabelProps = {
  children: string;
  style?: object;
};

/** Petit label en majuscules --muted suivi d'une ligne horizontale --line. */
export default function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{children}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: Colors.muted,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.line,
  },
});
