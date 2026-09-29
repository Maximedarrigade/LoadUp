import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getExerciseHistory, type ExerciseHistoryEntry } from "@/api/workouts";
import { Colors, FontFamily, Radius } from "@/theme";

function formatWeight(weight: number) {
  return Number.isInteger(weight) ? String(weight) : String(weight).replace(".", ",");
}

// Anciennes entrées (WorkoutLog) : un résumé "poids — séries × reps".
// Nouvelles séances : le détail série par série.
function describeEntry(entry: ExerciseHistoryEntry) {
  if (entry.source === "log") {
    return `${formatWeight(entry.weightUsed)} kg — ${entry.setsDone} séries × ${entry.repsDone} reps`;
  }
  return entry.sets.map((set) => `${formatWeight(set.weightUsed)}×${set.repsDone}`).join(" · ");
}

export default function ProgressScreen() {
  const { exerciseId, exerciseName } = useLocalSearchParams<{
    exerciseId: string;
    exerciseName: string;
  }>();

  const [logs, setLogs] = useState<ExerciseHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getExerciseHistory(exerciseId);
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
        <ActivityIndicator size="large" color={Colors.accent} />
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
          <Text
            style={[
              styles.summaryText,
              progressionKg > 0 && styles.summaryPositive,
              progressionKg < 0 && styles.summaryNegative,
            ]}
          >
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
        contentContainerStyle={{ gap: 10, marginTop: 16, paddingBottom: 20 }}
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
              <Text style={styles.logDetails}>{describeEntry(item)}</Text>
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
    paddingTop: 24,
    backgroundColor: Colors.bg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bg,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    textTransform: "uppercase",
    color: Colors.ink,
  },
  summary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
  },
  summaryText: {
    fontFamily: FontFamily.monoBold,
    fontSize: 16,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  summaryPositive: {
    color: Colors.flame,
  },
  summaryNegative: {
    color: Colors.accent,
  },
  logCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 12,
    borderRadius: Radius,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logDate: {
    fontFamily: FontFamily.mono,
    fontSize: 14,
    color: Colors.muted,
  },
  logDetails: {
    flexShrink: 1,
    textAlign: "right",
    fontFamily: FontFamily.monoBold,
    fontSize: 14,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  empty: {
    fontFamily: FontFamily.body,
    textAlign: "center",
    color: Colors.muted,
    marginTop: 20,
  },
});
