import { View, Text, StyleSheet } from "react-native";

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
    borderTopColor: "#eee",
    alignItems: "center",
    backgroundColor: "#000",
  },
  text: {
    fontSize: 12,
    color: "#fff",
  },
});