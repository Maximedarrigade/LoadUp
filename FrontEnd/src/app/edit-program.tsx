import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { updateProgram } from "@/api/programs";

export default function EditProgramScreen() {
  const { id, currentName, currentDescription } = useLocalSearchParams<{
    id: string;
    currentName: string;
    currentDescription: string;
  }>();

  const [name, setName] = useState(currentName || "");
  const [description, setDescription] = useState(currentDescription || "");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    if (!name.trim()) {
      setError("Le nom du programme est requis.");
      return;
    }

    try {
      await updateProgram(id, name, description);
      router.back();
    } catch (err) {
      setError("Erreur lors de la modification du programme.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modifier le programme</Text>

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
        numberOfLines={4}
      />

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
  textArea: {
    height: 100,
    textAlignVertical: "top",
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