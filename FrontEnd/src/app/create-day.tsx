import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { createProgramDay } from "@/api/programs";

export default function CreateDayScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    if (!name.trim()) {
      setError("Le nom du jour est requis.");
      return;
    }

    try {
      await createProgramDay(programId, name, 0);
      router.back();
    } catch (err) {
      setError("Erreur lors de la création du jour.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouveau jour</Text>

      <TextInput
        style={styles.input}
        placeholder="Ex: Jour 1 - Push"
        value={name}
        onChangeText={setName}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Ajouter le jour</Text>
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