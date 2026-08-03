import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { createProgramExercise } from "@/api/programs";

export default function CreateExerciseScreen() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [rest, setRest] = useState("");
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
      await createProgramExercise(dayId, name, setsNum, repsNum, restNum, 0);
      router.back();
    } catch (err) {
      setError("Erreur lors de la création de l'exercice.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouvel exercice</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom de l'exercice"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Nombre de séries"
        value={sets}
        onChangeText={setSets}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Nombre de répétitions"
        value={reps}
        onChangeText={setReps}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Durée de pause (secondes)"
        value={rest}
        onChangeText={setRest}
        keyboardType="numeric"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Ajouter l'exercice</Text>
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