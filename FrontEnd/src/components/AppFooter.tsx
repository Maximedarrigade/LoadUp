import { View, Text, StyleSheet } from "react-native";
import { Colors, FontFamily } from "@/theme";

export default function AppFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Développé par Maxime Darrigade</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    alignItems: "center",
    backgroundColor: Colors.surface2,
  },
  text: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.muted,
  },
});
