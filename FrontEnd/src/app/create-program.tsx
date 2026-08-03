import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { createProgram, createProgramDay, createProgramExercise } from "@/api/programs";

type ExerciseForm = {
  name: string;
  sets: string;
  reps: string;
  rest: string;
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
    field: keyof ExerciseForm,
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
            exOrder
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nouveau programme</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom du programme"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Détails (facultatif)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      {days.map((day, dayIndex) => (
        <View key={dayIndex} style={styles.dayBlock}>
          <View style={styles.dayHeader}>
            <TextInput
              style={[styles.input, styles.dayNameInput]}
              placeholder={`Nom du jour ${dayIndex + 1} (ex: Pecs-Triceps)`}
              value={day.name}
              onChangeText={(value) => updateDayName(dayIndex, value)}
            />
            {days.length > 1 ? (
              <TouchableOpacity onPress={() => removeDay(dayIndex)}>
                <Text style={styles.removeText}>Supprimer le jour</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {day.exercises.map((exercise, exerciseIndex) => (
            <View key={exerciseIndex} style={styles.exerciseBlock}>
              <TextInput
                style={styles.input}
                placeholder="Nom de l'exercice"
                value={exercise.name}
                onChangeText={(value) =>
                  updateExerciseField(dayIndex, exerciseIndex, "name", value)
                }
              />
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
                />
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Pause (s)"
                  value={exercise.rest}
                  onChangeText={(value) =>
                    updateExerciseField(dayIndex, exerciseIndex, "rest", value)
                  }
                  keyboardType="numeric"
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