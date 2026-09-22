import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { updateProgram } from "@/api/programs";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius } from "@/theme";

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
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erreur lors de la modification du programme.");
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
        placeholderTextColor={Colors.muted}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Détails (facultatif)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        placeholderTextColor={Colors.muted}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <IronButton
        label="Enregistrer les modifications"
        onPress={handleSubmit}
        style={{ marginTop: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
    gap: 12,
    backgroundColor: Colors.bg,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    textTransform: "uppercase",
    color: Colors.ink,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 12,
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: Colors.ink,
    backgroundColor: Colors.surface,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Colors.accent,
    textAlign: "center",
  },
});
