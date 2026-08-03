import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getWorkoutLogs } from "@/api/workouts";

type WorkoutLog = {
  id: string;
  date: string;
  weightUsed: number;
  repsDone: number;
  setsDone: number;
};

export default function ProgressScreen() {
  const { exerciseId, exerciseName } = useLocalSearchParams<{
    exerciseId: string;
    exerciseName: string;
  }>();

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getWorkoutLogs(exerciseId);
        setLogs(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [exerciseId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const first = logs[logs.length - 1];
  const latest = logs[0];
  const progressionKg = first && latest ? latest.weightUsed - first.weightUsed : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exerciseName}</Text>

      {logs.length > 0 ? (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {progressionKg > 0
              ? `+${progressionKg} kg depuis le début !`
              : progressionKg < 0
              ? `${progressionKg} kg depuis le début`
              : "Poids stable depuis le début"}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, marginTop: 16 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune séance enregistrée pour cet exercice.</Text>
        }
        renderItem={({ item }) => {
          const date = new Date(item.date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
          return (
            <View style={styles.logCard}>
              <Text style={styles.logDate}>{date}</Text>
              <Text style={styles.logDetails}>
                {item.weightUsed} kg — {item.setsDone} séries × {item.repsDone} reps
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  summary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  logCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logDate: {
    fontSize: 14,
    color: "#666",
  },
  logDetails: {
    fontSize: 14,
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
});