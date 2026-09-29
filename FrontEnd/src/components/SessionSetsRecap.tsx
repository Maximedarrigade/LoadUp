import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SectionLabel from "@/components/SectionLabel";
import type { WorkoutSet } from "@/api/workouts";
import type { QueueExercise } from "@/store/activeWorkout";
import { Colors, FontFamily, Radius } from "@/theme";

type SessionSetsRecapProps = {
  queue: QueueExercise[];
  sets: WorkoutSet[];
  onSave: (exerciseId: string, setIndex: number, weightUsed: number, repsDone: number) => Promise<void>;
};

function formatWeight(weight: number) {
  return Number.isInteger(weight) ? String(weight) : String(weight).replace(".", ",");
}

function setKey(exerciseId: string, setIndex: number) {
  return `${exerciseId}#${setIndex}`;
}

/**
 * Récapitulatif des séries déjà validées pendant la séance en cours.
 * Taper sur une série la rouvre pour corriger le poids et/ou les répétitions.
 */
export default function SessionSetsRecap({ queue, sets, onSave }: SessionSetsRecapProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const groups = queue
    .map((exercise) => ({
      exercise,
      sets: sets
        .filter((set) => set.programExerciseId === exercise.id)
        .sort((a, b) => a.setIndex - b.setIndex),
    }))
    .filter((group) => group.sets.length > 0);

  if (groups.length === 0) return null;

  function startEditing(set: WorkoutSet) {
    setEditingKey(setKey(set.programExerciseId, set.setIndex));
    setWeight(formatWeight(set.weightUsed));
    setReps(String(set.repsDone));
    setError("");
  }

  function cancelEditing() {
    setEditingKey(null);
    setError("");
  }

  async function saveEditing(set: WorkoutSet) {
    const weightNum = parseFloat(weight.replace(",", "."));
    const repsNum = parseInt(reps, 10);
    if (isNaN(weightNum) || isNaN(repsNum)) {
      setError("Merci de remplir le poids et les répétitions.");
      return;
    }

    setSaving(true);
    try {
      await onSave(set.programExerciseId, set.setIndex, weightNum, repsNum);
      setEditingKey(null);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Correction non enregistrée. Vérifie ta connexion et réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <SectionLabel>Séries validées</SectionLabel>
      <Text style={styles.hint}>Touche une série pour la corriger.</Text>

      {groups.map(({ exercise, sets: exerciseSets }) => (
        <View key={exercise.id} style={styles.group}>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {exercise.name}
          </Text>

          {exerciseSets.map((set) => {
            const key = setKey(set.programExerciseId, set.setIndex);

            if (key === editingKey) {
              return (
                <View key={key} style={[styles.row, styles.rowEditing]}>
                  <View style={styles.editLine}>
                    <Text style={styles.setIndex}>S{set.setIndex}</Text>
                    <TextInput
                      style={styles.editInput}
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="decimal-pad"
                      autoFocus
                      selectTextOnFocus
                    />
                    <Text style={styles.unit}>kg ×</Text>
                    <TextInput
                      style={styles.editInput}
                      value={reps}
                      onChangeText={setReps}
                      keyboardType="number-pad"
                      selectTextOnFocus
                    />
                  </View>
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing} disabled={saving}>
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => saveEditing(set)}
                      disabled={saving}
                    >
                      <Text style={styles.saveButtonText}>{saving ? "…" : "Enregistrer"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={key}
                style={styles.row}
                onPress={() => startEditing(set)}
                disabled={saving}
              >
                <Text style={styles.setIndex}>S{set.setIndex}</Text>
                <Text style={styles.setValue}>
                  {formatWeight(set.weightUsed)} kg × {set.repsDone}
                </Text>
                <Ionicons name="pencil" size={14} color={Colors.muted} />
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: 8,
  },
  hint: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.muted,
  },
  group: {
    gap: 6,
  },
  exerciseName: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 14,
    textTransform: "uppercase",
    color: Colors.ink,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  rowEditing: {
    flexDirection: "column",
    alignItems: "stretch",
    borderColor: Colors.accent,
  },
  setIndex: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
    color: Colors.muted,
    width: 28,
  },
  setValue: {
    flex: 1,
    fontFamily: FontFamily.monoBold,
    fontSize: 15,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  editLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editInput: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontFamily: FontFamily.monoBold,
    fontSize: 16,
    color: Colors.ink,
    backgroundColor: Colors.bg,
    textAlign: "center",
  },
  unit: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
    color: Colors.muted,
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.danger,
    marginTop: 8,
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 8,
    borderRadius: Radius,
    alignItems: "center",
  },
  cancelButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 8,
    borderRadius: Radius,
    alignItems: "center",
  },
  saveButtonText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 14,
    color: Colors.bg,
  },
});
