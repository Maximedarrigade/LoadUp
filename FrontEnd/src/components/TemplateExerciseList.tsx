import { View, Text, StyleSheet } from "react-native";
import type { TemplateExercise } from "@/api/templates";
import ExerciseThumbnail from "@/components/ExerciseThumbnail";
import { libraryExerciseName } from "@/utils/exerciseName";
import { Colors, FontFamily, Radius } from "@/theme";

/** Aperçu des exercices d'une séance prête : miniature, nom, séries × reps · repos. */
export default function TemplateExerciseList({ exercises }: { exercises: TemplateExercise[] }) {
  return (
    <View style={styles.list}>
      {exercises.map((exercise, index) => (
        <View key={`${exercise.exerciseLibraryId}-${index}`} style={styles.row}>
          <ExerciseThumbnail exerciseId={exercise.exerciseLibraryId} gifUrl={exercise.gifUrl} size={40} />
          <Text style={styles.name} numberOfLines={2}>
            {libraryExerciseName(exercise)}
          </Text>
          <View style={styles.numbers}>
            <Text style={styles.sets}>
              {exercise.sets} × {exercise.reps}
            </Text>
            <Text style={styles.rest}>{exercise.rest} s</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Rappel affiché sur les écrans de modèles. */
export function TemplateDisclaimer() {
  return (
    <Text style={styles.disclaimer}>
      Exemples pour débutant à intermédiaire : adapte les charges et le nombre de séries à ton niveau.
      Tout reste modifiable ensuite.
    </Text>
  );
}

export function sessionTotals(exercises: TemplateExercise[]) {
  const sets = exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  return `${exercises.length} exercices · ${sets} séries`;
}

const styles = StyleSheet.create({
  list: {
    gap: 6,
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 6,
  },
  name: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.ink,
  },
  numbers: {
    alignItems: "flex-end",
  },
  sets: {
    fontFamily: FontFamily.monoBold,
    fontSize: 14,
    color: Colors.accent,
    fontVariant: ["tabular-nums"],
  },
  rest: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    color: Colors.muted,
    fontVariant: ["tabular-nums"],
  },
  disclaimer: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    color: Colors.muted,
    borderLeftWidth: 2,
    borderLeftColor: Colors.flame,
    paddingLeft: 10,
    marginBottom: 16,
  },
});
