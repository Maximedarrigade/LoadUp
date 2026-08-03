import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

type QueueExercise = {
  id: string;
  name: string;
  targetSets: number;
  restDuration: number;
};

const MESSAGES = [
  "C'est le moment de tout donner",
  "Aujourd'hui, on repousse ses limites",
  "Prêt à devenir plus fort qu'hier ?",
  "Chaque série te rapproche de ton objectif",
  "Deviens fier de toi.",
  "Prouve-toi que tu en es capable.",
  "Chaque séance te rend plus fort.",
  "Personne ne le fera à ta place.",
  "Aujourd'hui, tu gagnes contre toi-même.",
  "Ta fierté se construit maintenant.",
  "Ce que tu fais aujourd'hui te définit.",
];

export default function StartDayScreen() {
  const { programId, dayName, exercisesQueue } = useLocalSearchParams<{
    programId: string;
    dayName: string;
    exercisesQueue: string;
  }>();

  const queue: QueueExercise[] = JSON.parse(exercisesQueue || "[]");
  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  function handleStart() {
    router.replace({
      pathname: "/log-workout",
      params: {
        programId,
        exerciseIndex: "0",
        exercisesQueue,
      },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.dayName}>{dayName}</Text>
      <Text style={styles.message}>{message}</Text>

      <Text style={styles.listTitle}>Au programme aujourd'hui :</Text>

      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item, index }) => (
          <View style={styles.exerciseRow}>
            <Text style={styles.exerciseIndex}>{index + 1}.</Text>
            <Text style={styles.exerciseText}>{item.name}</Text>
            <Text style={styles.exerciseSets}>{item.targetSets} séries</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Lets gooooooooo !</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    gap: 16,
  },
  dayName: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 10,
  },
  exerciseIndex: {
    fontWeight: "bold",
    color: "#999",
  },
  exerciseText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  exerciseSets: {
    fontSize: 13,
    color: "#666",
  },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});