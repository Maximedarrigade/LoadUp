import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { createProgramDay } from "@/api/programs";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius } from "@/theme";

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
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erreur lors de la création du jour.");
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
        placeholderTextColor={Colors.muted}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <IronButton label="Ajouter le jour" onPress={handleSubmit} style={{ marginTop: 12 }} />
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
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Colors.accent,
    textAlign: "center",
  },
});
