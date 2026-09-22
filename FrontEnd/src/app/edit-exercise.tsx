import { useRef, useState } from "react";
import { View, Text, TextInput, Keyboard, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { updateProgramExercise } from "@/api/programs";
import DismissKeyboardView from "@/components/DismissKeyboardView";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius } from "@/theme";

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
  const repsInputRef = useRef<TextInput>(null);
  const restInputRef = useRef<TextInput>(null);

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
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erreur lors de la modification de l'exercice.");
    }
  }

  return (
    <DismissKeyboardView style={styles.container}>
      <Text style={styles.title}>Modifier l'exercice</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom de l'exercice"
        value={name}
        onChangeText={setName}
        placeholderTextColor={Colors.muted}
        maxLength={100}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.smallInput, styles.numericInput]}
          placeholder="Séries"
          value={sets}
          onChangeText={setSets}
          keyboardType="numeric"
          maxLength={2}
          placeholderTextColor={Colors.muted}
          returnKeyType="next"
          onSubmitEditing={() => repsInputRef.current?.focus()}
        />
        <TextInput
          ref={repsInputRef}
          style={[styles.input, styles.smallInput, styles.numericInput]}
          placeholder="Reps"
          value={reps}
          onChangeText={setReps}
          keyboardType="numeric"
          maxLength={2}
          placeholderTextColor={Colors.muted}
          returnKeyType="next"
          onSubmitEditing={() => restInputRef.current?.focus()}
        />
        <TextInput
          ref={restInputRef}
          style={[styles.input, styles.smallInput, styles.numericInput]}
          placeholder="Pause (s)"
          value={rest}
          onChangeText={setRest}
          keyboardType="numeric"
          placeholderTextColor={Colors.muted}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <IronButton
        label="Enregistrer les modifications"
        onPress={handleSubmit}
        style={{ marginTop: 12 }}
      />
    </DismissKeyboardView>
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
  numericInput: {
    fontFamily: FontFamily.mono,
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
    fontFamily: FontFamily.bodyMedium,
    color: Colors.accent,
    textAlign: "center",
  },
});
