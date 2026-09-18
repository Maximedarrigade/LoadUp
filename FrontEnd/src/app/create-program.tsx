import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createProgram, createProgramDay, createProgramExercise } from "@/api/programs";
import { useExerciseSelectionStore } from "@/store/exerciseSelectionStore";
import ExerciseGif from "@/components/ExerciseGif";

type ExerciseForm = {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  exerciseLibraryId?: string | null;
  gifUrl?: string | null;
  manualMode?: boolean;
};

type DayForm = {
  name: string;
  exercises: ExerciseForm[];
};

export default function CreateProgramScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<DayForm[]>([
    { name: "", exercises: [{ name: "", sets: "", reps: "", rest: "" }] },
  ]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ dayIndex: number; exerciseIndex: number } | null>(
    null
  );
  const selected = useExerciseSelectionStore((state) => state.selected);
  const clearSelected = useExerciseSelectionStore((state) => state.clear);

  useFocusEffect(
    useCallback(() => {
      if (selected && activeSlot) {
        setDays((prev) => {
          const updated = prev.map((day) => ({ ...day, exercises: [...day.exercises] }));
          updated[activeSlot.dayIndex].exercises[activeSlot.exerciseIndex] = {
            ...updated[activeSlot.dayIndex].exercises[activeSlot.exerciseIndex],
            name: selected.name,
            exerciseLibraryId: selected.id,
            gifUrl: selected.gifUrl,
            manualMode: false,
          };
          return updated;
        });
        setActiveSlot(null);
        clearSelected();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, activeSlot, clearSelected])
  );

  function openCatalogFor(dayIndex: number, exerciseIndex: number) {
    setActiveSlot({ dayIndex, exerciseIndex });
    router.push("/exercise-library");
  }

  function enableManualModeFor(dayIndex: number, exerciseIndex: number) {
    const updated = [...days];
    updated[dayIndex].exercises[exerciseIndex] = {
      ...updated[dayIndex].exercises[exerciseIndex],
      name: "",
      exerciseLibraryId: null,
      gifUrl: null,
      manualMode: true,
    };
    setDays(updated);
  }

  function addDay() {
    setDays([...days, { name: "", exercises: [{ name: "", sets: "", reps: "", rest: "" }] }]);
  }

  function removeDay(dayIndex: number) {
    setDays(days.filter((_, i) => i !== dayIndex));
  }

  function updateDayName(dayIndex: number, value: string) {
    const updated = [...days];
    updated[dayIndex].name = value;
    setDays(updated);
  }

  function addExercise(dayIndex: number) {
    const updated = [...days];
    updated[dayIndex].exercises.push({ name: "", sets: "", reps: "", rest: "" });
    setDays(updated);
  }

  function removeExercise(dayIndex: number, exerciseIndex: number) {
    const updated = [...days];
    updated[dayIndex].exercises = updated[dayIndex].exercises.filter(
      (_, i) => i !== exerciseIndex
    );
    setDays(updated);
  }

  function updateExerciseField(
    dayIndex: number,
    exerciseIndex: number,
    field: "name" | "sets" | "reps" | "rest",
    value: string
  ) {
    const updated = [...days];
    updated[dayIndex].exercises[exerciseIndex][field] = value;
    setDays(updated);
  }

  async function handleSubmit() {
    setError("");

    if (!name.trim()) {
      setError("Le nom du programme est requis.");
      return;
    }

    for (const day of days) {
      if (!day.name.trim()) {
        setError("Chaque jour doit avoir un nom.");
        return;
      }
      for (const ex of day.exercises) {
        if (!ex.name.trim() || !ex.sets || !ex.reps || !ex.rest) {
          setError(`Complète tous les champs des exercices du jour "${day.name}".`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const program = await createProgram(name, description);

      for (let dayOrder = 0; dayOrder < days.length; dayOrder++) {
        const day = days[dayOrder];
        const createdDay = await createProgramDay(program.id, day.name, dayOrder);

        for (let exOrder = 0; exOrder < day.exercises.length; exOrder++) {
          const ex = day.exercises[exOrder];
          await createProgramExercise(
            createdDay.id,
            ex.name,
            parseInt(ex.sets, 10),
            parseInt(ex.reps, 10),
            parseInt(ex.rest, 10),
            exOrder,
            ex.exerciseLibraryId ?? null
          );
        }
      }

      router.replace("/");
    } catch (err) {
      setError("Erreur lors de la création du programme.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Nouveau programme</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom du programme"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#888"
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Détails (facultatif)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        placeholderTextColor="#888"
      />

      {days.map((day, dayIndex) => (
        <View key={dayIndex} style={styles.dayBlock}>
          <View style={styles.dayHeader}>
            <TextInput
              style={[styles.input, styles.dayNameInput]}
              placeholder={`Nom du jour ${dayIndex + 1} (ex: Pecs-Triceps)`}
              value={day.name}
              onChangeText={(value) => updateDayName(dayIndex, value)}
              placeholderTextColor="#888"
            />
            {days.length > 1 ? (
              <TouchableOpacity onPress={() => removeDay(dayIndex)}>
                <Text style={styles.removeText}>Supprimer le jour</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {day.exercises.map((exercise, exerciseIndex) => (
            <View key={exerciseIndex} style={styles.exerciseBlock}>
              {exercise.manualMode ? (
                <TextInput
                  style={styles.input}
                  placeholder="Nom de l'exercice"
                  value={exercise.name}
                  onChangeText={(value) =>
                    updateExerciseField(dayIndex, exerciseIndex, "name", value)
                  }
                  placeholderTextColor="#888"
                />
              ) : (
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={[styles.input, styles.pickerField]}
                    onPress={() => openCatalogFor(dayIndex, exerciseIndex)}
                  >
                    <Text style={exercise.name ? styles.pickerValue : styles.pickerPlaceholder}>
                      {exercise.name || "Toucher pour choisir dans le catalogue"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.gifButton}
                    onPress={() => openCatalogFor(dayIndex, exerciseIndex)}
                  >
                    <Ionicons name="images" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {exercise.gifUrl ? (
                <View style={styles.libraryBadge}>
                  <ExerciseGif gifUrl={exercise.gifUrl} size={40} />
                  <Text style={styles.libraryBadgeText}>Exercice du catalogue sélectionné</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() =>
                  exercise.manualMode
                    ? openCatalogFor(dayIndex, exerciseIndex)
                    : enableManualModeFor(dayIndex, exerciseIndex)
                }
              >
                <Text style={styles.manualLink}>
                  {exercise.manualMode
                    ? "Choisir dans le catalogue à la place"
                    : "Je ne trouve pas mon exercice ? Saisir un nom manuellement"}
                </Text>
              </TouchableOpacity>

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Séries"
                  value={exercise.sets}
                  onChangeText={(value) =>
                    updateExerciseField(dayIndex, exerciseIndex, "sets", value)
                  }
                  keyboardType="numeric"
                  maxLength={2}
                  placeholderTextColor="#888"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Reps"
                  value={exercise.reps}
                  onChangeText={(value) =>
                    updateExerciseField(dayIndex, exerciseIndex, "reps", value)
                  }
                  keyboardType="numeric"
                  maxLength={2}
                  placeholderTextColor="#888"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Pause (s)"
                  value={exercise.rest}
                  onChangeText={(value) =>
                    updateExerciseField(dayIndex, exerciseIndex, "rest", value)
                  }
                  keyboardType="numeric"
                  placeholderTextColor="#888"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
              {day.exercises.length > 1 ? (
                <TouchableOpacity onPress={() => removeExercise(dayIndex, exerciseIndex)}>
                  <Text style={styles.removeText}>Supprimer cet exercice</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          <TouchableOpacity
            style={styles.addExerciseButton}
            onPress={() => addExercise(dayIndex)}
          >
            <Text style={styles.addExerciseButtonText}>+ Ajouter un exercice</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addDayButton} onPress={addDay}>
        <Text style={styles.addDayButtonText}>+ Ajouter un jour</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? "Création..." : "Créer le programme"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  dayBlock: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  dayHeader: {
    gap: 6,
  },
  dayNameInput: {
    fontWeight: "600",
  },
  exerciseBlock: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  smallInput: {
    width: 70,
    flex: 0,
  },
  pickerRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  pickerField: {
    flex: 1,
  },
  gifButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: "#888",
  },
  pickerValue: {
    fontSize: 16,
    color: "#000",
  },
  libraryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 6,
  },
  libraryBadgeText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  manualLink: {
    fontSize: 12,
    color: "#0066cc",
    fontWeight: "600",
  },
  removeText: {
    color: "#cc0000",
    fontSize: 13,
  },
  addExerciseButton: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  addExerciseButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  addDayButton: {
    backgroundColor: "#e0e0e0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  addDayButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  error: {
    color: "red",
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 40,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});