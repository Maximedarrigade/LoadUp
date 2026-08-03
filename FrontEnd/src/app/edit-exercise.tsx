import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { updateProgramExercise } from "@/api/programs";

export default function EditExerciseScreen() {
  const { exerciseId, currentName, currentSets, currentReps, currentRest } =
    useLocalSearchParams<{
      exerciseId: string;
      currentName: string;
      currentSets: string;
      currentReps: string;
      currentRest: string;
    }>();

  const [name, setName] = useState(currentName || "");
  const [sets, setSets] = useState(currentSets || "");
  const [reps, setReps] = useState(currentReps || "");
  const [rest, setRest] = useState(currentRest || "");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    const setsNum = parseInt(sets, 10);
    const repsNum = parseInt(reps, 10);
    const restNum = parseInt(rest, 10);

    if (!name.trim() || isNaN(setsNum) || isNaN(repsNum) || isNaN(restNum)) {
      setError("Merci de remplir tous les champs correctement.");
      return;
    }

    try {
      await updateProgramExercise(exerciseId, name, setsNum, repsNum, restNum);
      router.back();
    } catch (err) {
      setError("Erreur lors de la modification de l'exercice.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modifier l'exercice</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom de l'exercice"
        value={name}
        onChangeText={setName}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.smallInput]}
          placeholder="Séries"
          value={sets}
          onChangeText={setSets}
          keyboardType="numeric"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.smallInput]}
          placeholder="Reps"
          value={reps}
          onChangeText={setReps}
          keyboardType="numeric"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.smallInput]}
          placeholder="Pause (s)"
          value={rest}
          onChangeText={setRest}
          keyboardType="numeric"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Enregistrer les modifications</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  smallInput: {
    width: 70,
    flex: 0,
  },
  error: {
    color: "red",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});