import { useCallback, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProgramById, deleteProgram, deleteProgramExercise } from "@/api/programs";
import ExerciseThumbnail from "@/components/ExerciseThumbnail";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius, AccentBorderWidth } from "@/theme";

type Exercise = {
  id: string;
  name: string;
  targetSets: number;
  targetReps: number;
  restDuration: number;
  exerciseLibrary: { id: string; gifUrl: string; bodyParts?: string[] } | null;
};

type Day = {
  id: string;
  name: string;
  exercises: Exercise[];
};

type ProgramDetail = {
  id: string;
  name: string;
  description: string | null;
  days: Day[];
};

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingExerciseId, setConfirmingExerciseId] = useState<string | null>(null);

  const loadProgram = useCallback(async () => {
    try {
      const data = await getProgramById(id);
      setProgram(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadProgram();
    }, [loadProgram])
  );

  async function handleConfirmDelete() {
    if (!program) return;
    try {
      await deleteProgram(program.id);
      router.replace("/");
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDeleteExercise(exerciseId: string) {
    try {
      await deleteProgramExercise(exerciseId);
      setConfirmingExerciseId(null);
      loadProgram();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!program) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Programme introuvable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{program.name}</Text>
      {program.description ? (
        <Text style={styles.description}>{program.description}</Text>
      ) : null}

      {confirmingDelete ? (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>
            Supprimer "{program.name}" ? Cette action est irréversible.
          </Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setConfirmingDelete(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmDelete}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              router.push({
                pathname: "/edit-program",
                params: {
                  id: program.id,
                  currentName: program.name,
                  currentDescription: program.description || "",
                },
              })
            }
          >
            <Ionicons name="pencil" size={20} color={Colors.ink} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setConfirmingDelete(true)}
          >
            <Ionicons name="trash" size={20} color={Colors.accent} />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.addDayButton}
        onPress={() =>
          router.push({ pathname: "/create-day", params: { programId: program.id } })
        }
      >
        <Text style={styles.addDayButtonText}>+ Ajouter un jour</Text>
      </TouchableOpacity>

      <FlatList
        data={program.days}
        keyExtractor={(day) => day.id}
        contentContainerStyle={{ gap: 24, marginTop: 24, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun jour dans ce programme.</Text>
        }
        renderItem={({ item: day }) => (
          <View>
            <Text style={styles.dayTitle}>{day.name}</Text>

            <IronButton
              label="▶ Démarrer"
              style={styles.startDayButton}
              onPress={() =>
                router.push({
                  pathname: "/start-day",
                  params: {
                    programId: program.id,
                    dayName: day.name,
                    exercisesQueue: JSON.stringify(
                      day.exercises.map((e) => ({
                        id: e.id,
                        name: e.name,
                        targetSets: e.targetSets,
                        restDuration: e.restDuration,
                        gifUrl: e.exerciseLibrary?.gifUrl ?? null,
                        libraryId: e.exerciseLibrary?.id ?? null,
                        bodyParts: e.exerciseLibrary?.bodyParts ?? [],
                      }))
                    ),
                  },
                })
              }
            />

            {day.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                {confirmingExerciseId === exercise.id ? (
                  <View>
                    <Text style={styles.confirmTextSmall}>
                      Supprimer "{exercise.name}" ?
                    </Text>
                    <View style={styles.confirmActionsSmall}>
                      <TouchableOpacity
                        style={styles.cancelButtonSmall}
                        onPress={() => setConfirmingExerciseId(null)}
                      >
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmButtonSmall}
                        onPress={() => handleDeleteExercise(exercise.id)}
                      >
                        <Text style={styles.confirmButtonText}>Confirmer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.exerciseHeader}>
                      <ExerciseThumbnail
                        exerciseId={exercise.exerciseLibrary?.id}
                        gifUrl={exercise.exerciseLibrary?.gifUrl}
                        size={48}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseDetails}>
                          {exercise.targetSets} séries × {exercise.targetReps} reps —{" "}
                          {exercise.restDuration}s de pause
                        </Text>
                      </View>
                      <View style={styles.exerciseIcons}>
                        <TouchableOpacity
                          style={styles.iconButtonSmall}
                          onPress={() =>
                            router.push({
                              pathname: "/edit-exercise",
                              params: {
                                exerciseId: exercise.id,
                                currentName: exercise.name,
                                currentSets: String(exercise.targetSets),
                                currentReps: String(exercise.targetReps),
                                currentRest: String(exercise.restDuration),
                              },
                            })
                          }
                        >
                          <Ionicons name="pencil" size={16} color={Colors.ink} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButtonSmall}
                          onPress={() => setConfirmingExerciseId(exercise.id)}
                        >
                          <Ionicons name="trash" size={16} color={Colors.accent} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.progressLink}
                      onPress={() =>
                        router.push({
                          pathname: "/progress",
                          params: { exerciseId: exercise.id, exerciseName: exercise.name },
                        })
                      }
                    >
                      <Text style={styles.progressLinkText}>Voir la progression →</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={() =>
                router.push({ pathname: "/create-exercise", params: { dayId: day.id } })
              }
            >
              <Text style={styles.addExerciseButtonText}>+ Ajouter un exercice</Text>
            </TouchableOpacity>
          </View>
        )}
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
    fontSize: 26,
    textTransform: "uppercase",
    color: Colors.ink,
  },
  description: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.muted,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  iconButton: {
    padding: 10,
    borderRadius: Radius,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  confirmBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius,
  },
  confirmText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.accent,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 10,
    borderRadius: Radius,
    alignItems: "center",
  },
  cancelButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    padding: 10,
    borderRadius: Radius,
    alignItems: "center",
  },
  confirmButtonText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 14,
    color: Colors.bg,
  },
  addDayButton: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 12,
    borderRadius: Radius,
    alignItems: "center",
    marginTop: 16,
  },
  addDayButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.ink,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  dayTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 19,
    textTransform: "uppercase",
    color: Colors.ink,
    marginBottom: 10,
  },
  startDayButton: {
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.accent,
    padding: 12,
    borderRadius: Radius,
    marginBottom: 8,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  exerciseIcons: {
    flexDirection: "row",
    gap: 6,
  },
  iconButtonSmall: {
    padding: 6,
    borderRadius: Radius,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  exerciseName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.ink,
  },
  exerciseDetails: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  progressLink: {
    marginTop: 10,
  },
  progressLinkText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  confirmTextSmall: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  confirmActionsSmall: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  cancelButtonSmall: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 8,
    borderRadius: Radius,
    alignItems: "center",
  },
  confirmButtonSmall: {
    flex: 1,
    backgroundColor: Colors.accent,
    padding: 8,
    borderRadius: Radius,
    alignItems: "center",
  },
  addExerciseButton: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 10,
    borderRadius: Radius,
    alignItems: "center",
    marginTop: 4,
  },
  addExerciseButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.ink,
  },
  emptyText: {
    fontFamily: FontFamily.body,
    textAlign: "center",
    color: Colors.muted,
    marginTop: 20,
  },
});
