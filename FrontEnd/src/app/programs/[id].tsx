import { useCallback, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProgramById, deleteProgram, deleteProgramExercise } from "@/api/programs";

type Exercise = {
  id: string;
  name: string;
  targetSets: number;
  targetReps: number;
  restDuration: number;
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!program) {
    return (
      <View style={styles.center}>
        <Text>Programme introuvable.</Text>
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
            <Ionicons name="pencil" size={20} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setConfirmingDelete(true)}
          >
            <Ionicons name="trash" size={20} color="#cc0000" />
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
        contentContainerStyle={{ gap: 20, marginTop: 20 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun jour dans ce programme.</Text>
        }
        renderItem={({ item: day }) => (
          <View>
            <Text style={styles.dayTitle}>{day.name}</Text>

            <TouchableOpacity
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
                      }))
                    ),
                  },
                })
              }
            >
              <Text style={styles.startDayButtonText}>▶ Démarrer</Text>
            </TouchableOpacity>

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
                          <Ionicons name="pencil" size={16} color="#333" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButtonSmall}
                          onPress={() => setConfirmingExerciseId(exercise.id)}
                        >
                          <Ionicons name="trash" size={16} color="#cc0000" />
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
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  confirmBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fff0f0",
    borderRadius: 10,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cc0000",
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#cc0000",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  addDayButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  addDayButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  startDayButton: {
    backgroundColor: "#0a8a0a",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  startDayButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  exerciseCard: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  exerciseIcons: {
    flexDirection: "row",
    gap: 6,
  },
  iconButtonSmall: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#e5e5e5",
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseDetails: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  progressLink: {
    marginTop: 8,
  },
  progressLinkText: {
    fontSize: 13,
    color: "#0066cc",
    fontWeight: "600",
  },
  confirmTextSmall: {
    fontSize: 13,
    fontWeight: "600",
    color: "#cc0000",
  },
  confirmActionsSmall: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  cancelButtonSmall: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  confirmButtonSmall: {
    flex: 1,
    backgroundColor: "#cc0000",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  addExerciseButton: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  addExerciseButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
});