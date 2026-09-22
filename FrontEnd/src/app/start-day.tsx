import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getStreak } from "@/api/streak";
import { getWorkoutLogs } from "@/api/workouts";
import StreakBadge from "@/components/StreakBadge";
import IronButton from "@/components/IronButton";
import ExerciseThumbnail from "@/components/ExerciseThumbnail";
import { Colors, FontFamily, Radius } from "@/theme";

type QueueExercise = {
  id: string;
  name: string;
  targetSets: number;
  restDuration: number;
  gifUrl?: string | null;
  libraryId?: string | null;
  bodyParts?: string[];
};

type LastPerformance = { weightUsed: number; repsDone: number } | null;

// Estimation grossière : ~2 à 2,5 min par série (échauffement + exécution + repos).
const MINUTES_PER_SET = 2.25;

function formatWeight(weight: number) {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1).replace(".", ",");
}

export default function StartDayScreen() {
  const { programId, dayName, exercisesQueue } = useLocalSearchParams<{
    programId: string;
    dayName: string;
    exercisesQueue: string;
  }>();

  const queue: QueueExercise[] = useMemo(() => JSON.parse(exercisesQueue || "[]"), [exercisesQueue]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastPerformances, setLastPerformances] = useState<Record<string, LastPerformance>>({});

  useEffect(() => {
    getStreak()
      .then((data) => setCurrentStreak(data.currentStreak))
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled(queue.map((exercise) => getWorkoutLogs(exercise.id))).then((results) => {
      if (cancelled) return;
      const next: Record<string, LastPerformance> = {};
      results.forEach((result, index) => {
        const exerciseId = queue[index].id;
        if (result.status === "fulfilled" && result.value.length > 0) {
          const [latest] = result.value;
          next[exerciseId] = { weightUsed: latest.weightUsed, repsDone: latest.repsDone };
        } else {
          next[exerciseId] = null;
        }
      });
      setLastPerformances(next);
    });

    return () => {
      cancelled = true;
    };
  }, [exercisesQueue]);

  const totalSets = queue.reduce((sum, exercise) => sum + exercise.targetSets, 0);
  const estimatedMinutes = Math.max(1, Math.round(totalSets * MINUTES_PER_SET));

  const muscleGroups = useMemo(() => {
    const groups = new Set<string>();
    queue.forEach((exercise) => exercise.bodyParts?.forEach((part) => groups.add(part)));
    return Array.from(groups).join(" · ");
  }, [queue]);

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

  function handleClose() {
    router.back();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={24} color={Colors.muted} />
        </TouchableOpacity>

        <Text style={styles.dayName}>{dayName}</Text>
        {muscleGroups ? (
          <Text style={styles.muscleGroups} numberOfLines={1}>
            {muscleGroups}
          </Text>
        ) : null}

        <StreakBadge currentStreak={currentStreak} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{queue.length}</Text>
          <Text style={styles.statLabel}>Exercices</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{totalSets}</Text>
          <Text style={styles.statLabel}>Séries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statTile}>
          <Text style={styles.statValue}>~{estimatedMinutes}</Text>
          <Text style={styles.statLabel}>Min</Text>
        </View>
      </View>

      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>Au programme</Text>
        <View style={styles.sectionLine} />
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        style={{ flex: 1 }}
        renderItem={({ item, index }) => {
          const lastPerf = lastPerformances[item.id];
          return (
            <View style={styles.exerciseRow}>
              <Text style={styles.exerciseIndex}>{index + 1}</Text>
              <ExerciseThumbnail exerciseId={item.libraryId} gifUrl={item.gifUrl} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.exerciseLastPerf}>
                  {lastPerf
                    ? `Dernière fois — ${formatWeight(lastPerf.weightUsed)} kg × ${lastPerf.repsDone}`
                    : lastPerf === null
                    ? "Pas encore de séance enregistrée"
                    : "…"}
                </Text>
              </View>
              <Text style={styles.exerciseSets}>{item.targetSets}×</Text>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <IronButton label="Commencer la séance" onPress={handleStart} />
        <TouchableOpacity onPress={handleClose} style={styles.cancelLink}>
          <Text style={styles.cancelLinkText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    backgroundColor: Colors.surface2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    padding: 20,
    paddingTop: 24,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  dayName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 30,
    textTransform: "uppercase",
    color: Colors.ink,
    paddingRight: 36,
  },
  muscleGroups: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 4,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    paddingVertical: 14,
  },
  statTile: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.line,
  },
  statValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: 22,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.muted,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: Colors.muted,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.line,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 10,
    marginHorizontal: 20,
  },
  exerciseIndex: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
    color: Colors.muted,
    width: 16,
    textAlign: "center",
  },
  exerciseName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  exerciseLastPerf: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  exerciseSets: {
    fontFamily: FontFamily.monoBold,
    fontSize: 16,
    color: Colors.accent,
    fontVariant: ["tabular-nums"],
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: Colors.bg,
  },
  cancelLink: {
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelLinkText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.muted,
  },
});
