import { useCallback, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Keyboard, StyleSheet } from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createProgramExercise } from "@/api/programs";
import { useExerciseSelectionStore } from "@/store/exerciseSelectionStore";
import ExerciseThumbnail from "@/components/ExerciseThumbnail";
import DismissKeyboardView from "@/components/DismissKeyboardView";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius } from "@/theme";

export default function CreateExerciseScreen() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const selected = useExerciseSelectionStore((state) => state.selected);
  const clearSelected = useExerciseSelectionStore((state) => state.clear);

  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [rest, setRest] = useState("");
  const [error, setError] = useState("");
  const [libraryExercise, setLibraryExercise] = useState<{ id: string; gifUrl: string } | null>(
    null
  );
  const [manualMode, setManualMode] = useState(false);
  const repsInputRef = useRef<TextInput>(null);
  const restInputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      if (selected) {
        setName(selected.name);
        setLibraryExercise({ id: selected.id, gifUrl: selected.gifUrl });
        setManualMode(false);
        clearSelected();
      }
    }, [selected, clearSelected])
  );

  function openCatalog() {
    router.push("/exercise-library");
  }

  function enableManualMode() {
    setManualMode(true);
    setLibraryExercise(null);
    setName("");
  }

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
      await createProgramExercise(
        dayId,
        name,
        setsNum,
        repsNum,
        restNum,
        0,
        libraryExercise?.id ?? null
      );
      router.back();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erreur lors de la création de l'exercice.");
    }
  }

  return (
    <DismissKeyboardView style={styles.container}>
      <Text style={styles.title}>Nouvel exercice</Text>

      {manualMode ? (
        <TextInput
          style={styles.input}
          placeholder="Nom de l'exercice"
          value={name}
          onChangeText={setName}
          placeholderTextColor={Colors.muted}
          maxLength={100}
        />
      ) : (
        <View style={styles.pickerRow}>
          <TouchableOpacity style={[styles.input, styles.pickerField]} onPress={openCatalog}>
            <Text style={name ? styles.pickerValue : styles.pickerPlaceholder}>
              {name || "Toucher pour choisir dans le catalogue"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gifButton} onPress={openCatalog}>
            <Ionicons name="images" size={22} color={Colors.bg} />
          </TouchableOpacity>
        </View>
      )}

      {libraryExercise ? (
        <View style={styles.libraryBadge}>
          <ExerciseThumbnail
            exerciseId={libraryExercise.id}
            gifUrl={libraryExercise.gifUrl}
            size={44}
          />
          <Text style={styles.libraryBadgeText}>Exercice du catalogue sélectionné</Text>
        </View>
      ) : null}

      <TouchableOpacity onPress={manualMode ? openCatalog : enableManualMode}>
        <Text style={styles.manualLink}>
          {manualMode
            ? "Choisir dans le catalogue à la place"
            : "Je ne trouve pas mon exercice ? Saisir un nom manuellement"}
        </Text>
      </TouchableOpacity>

      <TextInput
        style={[styles.input, styles.numericInput]}
        placeholder="Nombre de séries"
        value={sets}
        onChangeText={setSets}
        keyboardType="numeric"
        placeholderTextColor={Colors.muted}
        returnKeyType="next"
        onSubmitEditing={() => repsInputRef.current?.focus()}
      />
      <TextInput
        ref={repsInputRef}
        style={[styles.input, styles.numericInput]}
        placeholder="Nombre de répétitions"
        value={reps}
        onChangeText={setReps}
        keyboardType="numeric"
        placeholderTextColor={Colors.muted}
        returnKeyType="next"
        onSubmitEditing={() => restInputRef.current?.focus()}
      />
      <TextInput
        ref={restInputRef}
        style={[styles.input, styles.numericInput]}
        placeholder="Durée de pause (secondes)"
        value={rest}
        onChangeText={setRest}
        keyboardType="numeric"
        placeholderTextColor={Colors.muted}
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <IronButton label="Ajouter l'exercice" onPress={handleSubmit} style={{ marginTop: 12 }} />
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
  pickerRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  pickerField: {
    flex: 1,
  },
  gifButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerPlaceholder: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: Colors.muted,
  },
  pickerValue: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 16,
    color: Colors.ink,
  },
  manualLink: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  libraryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 8,
  },
  libraryBadgeText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.muted,
    flex: 1,
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Colors.accent,
    textAlign: "center",
  },
});
