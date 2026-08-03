import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import RestTimer from "@/components/RestTimer";

export default function TimerScreen() {
  const { duration } = useLocalSearchParams<{ duration: string }>();
  const seconds = parseInt(duration || "60", 10);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Temps de repos</Text>
      <RestTimer initialSeconds={seconds} onFinish={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
});