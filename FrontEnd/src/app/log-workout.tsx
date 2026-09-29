import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Keyboard, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import {
  finishWorkoutSession,
  getCurrentWorkoutSession,
  getExerciseHistory,
  saveWorkoutSet,
  type WorkoutSet,
} from "@/api/workouts";
import {
  clearActiveWorkout,
  loadActiveWorkout,
  saveActiveWorkout,
  type ActiveWorkout,
} from "@/store/activeWorkout";
import RestTimer from "@/components/RestTimer";
import ExerciseGif from "@/components/ExerciseGif";
import DismissKeyboardView from "@/components/DismissKeyboardView";
import IronButton from "@/components/IronButton";
import SessionSetsRecap from "@/components/SessionSetsRecap";
import { confirmAction } from "@/utils/confirm";
import { Colors, FontFamily, Radius } from "@/theme";

type Phase = "loading" | "missing" | "set" | "resting" | "exerciseDone" | "finish";

const EXERCISE_DONE_MESSAGES = [
  "T'as arraché le matos ou quoi ?!",
  "La fonte a demandé grâce.",
  "Même Hercule prend des notes.",
  "Thor a demandé ton numéro.",
  "Le tapis de sol a eu peur.",
  "Popeye appelle, il veut des conseils.",
  "La barre a posté sa démission.",
  "Tes biceps demandent une augmentation.",
  "Le miroir de la salle a pris une photo souvenir.",
];

const DAY_DONE_MESSAGES = [
  "Les poids ont pas fait les malins aujourd'hui !",
  "La salle de sport te doit des excuses.",
  "T'as tellement forcé que la barre a demandé un CDI.",
  "Aujourd'hui, c'est toi le patron de la fonte.",
  "Ton canapé t'attend, il a préparé le café.",
  "Bravo, t'as fait pleurer la gravité.",
  "Les haltères parlent encore de toi dans le vestiaire.",
  "T'as mis la salle en PLS.",
  "Ta douche t'attend, elle a mérité sa pause aussi.",
];

function randomItem(items: string[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatWeight(weight: number) {
  return Number.isInteger(weight) ? String(weight) : String(weight).replace(".", ",");
}

function nextPosition(workout: ActiveWorkout): ActiveWorkout {
  const exercise = workout.queue[workout.exerciseIndex];
  if (exercise && workout.setIndex < exercise.targetSets) {
    return { ...workout, setIndex: workout.setIndex + 1 };
  }
  return { ...workout, exerciseIndex: workout.exerciseIndex + 1, setIndex: 1 };
}

function hasSet(sets: WorkoutSet[], exerciseId: string, setIndex: number) {
  return sets.some((set) => set.programExerciseId === exerciseId && set.setIndex === setIndex);
}

// Si l'appli a été fermée juste après l'enregistrement d'une série, mais avant la mise à jour
// de la position locale, on saute les séries que l'API a déjà reçues.
function skipSavedSets(workout: ActiveWorkout, sets: WorkoutSet[]) {
  let position = workout;
  while (
    position.exerciseIndex < position.queue.length &&
    hasSet(sets, position.queue[position.exerciseIndex].id, position.setIndex)
  ) {
    position = nextPosition(position);
  }
  return position;
}

export default function LogWorkoutScreen() {
  const [workout, setWorkout] = useState<ActiveWorkout | null>(null);
  const [sessionSets, setSessionSets] = useState<WorkoutSet[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [doneExerciseName, setDoneExerciseName] = useState("");
  const repsInputRef = useRef<TextInput>(null);

  const current = workout ? workout.queue[workout.exerciseIndex] : undefined;
  const exerciseDoneMessage = useMemo(() => randomItem(EXERCISE_DONE_MESSAGES), [doneExerciseName]);
  const dayDoneMessage = useMemo(() => randomItem(DAY_DONE_MESSAGES), []);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    async function restore() {
      const local = await loadActiveWorkout();
      if (!local) {
        setPhase("missing");
        return;
      }

      let sets: WorkoutSet[] = [];
      try {
        const session = await getCurrentWorkoutSession();
        if (!session || session.id !== local.sessionId) {
          // La séance a été terminée (ou remplacée) entre-temps : rien à reprendre.
          await clearActiveWorkout();
          setPhase("missing");
          return;
        }
        sets = session.sets;
      } catch (err) {
        // Hors ligne : on reprend sur la position locale, l'API rattrapera à la prochaine série.
        console.error(err);
      }

      const position = skipSavedSets(local, sets);
      if (position !== local) await saveActiveWorkout(position);

      setSessionSets(sets);
      setWorkout(position);
      setPhase(position.exerciseIndex >= position.queue.length ? "finish" : "set");
    }
    restore();
  }, []);

  // Pré-remplit le poids : celui de la série précédente dans la séance, sinon celui
  // de la dernière fois sur cet exercice. Les répétitions sont toujours à saisir.
  const positionKey = workout ? `${workout.exerciseIndex}-${workout.setIndex}` : "";
  useEffect(() => {
    if (!workout || !current) return;
    setReps("");
    setError("");

    const previousSets = sessionSets
      .filter((set) => set.programExerciseId === current.id && set.setIndex < workout.setIndex)
      .sort((a, b) => b.setIndex - a.setIndex);
    if (previousSets.length > 0) {
      setWeight(formatWeight(previousSets[0].weightUsed));
      return;
    }

    setWeight("");
    let cancelled = false;
    getExerciseHistory(current.id)
      .then(([latest]) => {
        if (!cancelled && latest) {
          setWeight((prev) => prev || formatWeight(latest.weightUsed));
        }
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [positionKey]);

  function storeSet(saved: WorkoutSet) {
    setSessionSets((prev) => [
      ...prev.filter(
        (set) => !(set.programExerciseId === saved.programExerciseId && set.setIndex === saved.setIndex)
      ),
      saved,
    ]);
  }

  // Correction d'une série déjà validée : même route que la validation (upsert côté API).
  // Refusée par l'API une fois la séance terminée.
  async function handleCorrectSet(exerciseId: string, setIndex: number, weightUsed: number, repsDone: number) {
    if (!workout) return;
    const saved = await saveWorkoutSet(workout.sessionId, exerciseId, setIndex, weightUsed, repsDone);
    storeSet(saved);
  }

  async function handleValidateSet() {
    if (!workout || !current) return;
    setError("");

    const weightNum = parseFloat(weight.replace(",", "."));
    const repsNum = parseInt(reps, 10);
    if (isNaN(weightNum) || isNaN(repsNum)) {
      setError("Merci de remplir le poids et les répétitions.");
      return;
    }

    setSaving(true);
    let saved: WorkoutSet;
    try {
      saved = await saveWorkoutSet(workout.sessionId, current.id, workout.setIndex, weightNum, repsNum);
    } catch (err) {
      console.error(err);
      setError("Série non enregistrée. Vérifie ta connexion et réessaie.");
      setSaving(false);
      return;
    }

    storeSet(saved);

    const next = nextPosition(workout);
    await saveActiveWorkout(next);
    setWorkout(next);
    setSaving(false);
    Keyboard.dismiss();

    if (next.exerciseIndex === workout.exerciseIndex) {
      setPhase("resting");
    } else if (next.exerciseIndex >= next.queue.length) {
      setPhase("finish");
    } else {
      setDoneExerciseName(current.name);
      setPhase("exerciseDone");
    }
  }

  async function handleFinish() {
    if (!workout) return;
    setError("");
    setFinishing(true);
    try {
      await finishWorkoutSession(workout.sessionId);
    } catch (err) {
      console.error(err);
      setError("Impossible de terminer la séance. Vérifie ta connexion et réessaie.");
      setFinishing(false);
      return;
    }
    await clearActiveWorkout();
    router.replace(`/programs/${workout.programId}`);
  }

  function handleFinishEarly() {
    confirmAction(
      "Terminer la séance ?",
      "Les séries restantes ne seront pas faites. Les séries déjà validées restent enregistrées.",
      handleFinish,
      "Terminer"
    );
  }

  if (phase === "loading") {
    return <View style={styles.center} />;
  }

  if (phase === "missing" || !workout) {
    return (
      <View style={styles.center}>
        <Text style={styles.exerciseName}>Aucune séance en cours.</Text>
        <IronButton label="Retour à l'accueil" onPress={() => router.replace("/")} />
      </View>
    );
  }

  const recap = (
    <SessionSetsRecap queue={workout.queue} sets={sessionSets} onSave={handleCorrectSet} />
  );

  if (phase === "finish") {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.doneTitle}>{dayDoneMessage}</Text>
        <Text style={styles.exerciseName}>{workout.dayName}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <IronButton label="Terminer la séance" onPress={handleFinish} loading={finishing} />
        {recap}
      </ScrollView>
    );
  }

  if (!current) return null;

  if (phase === "exerciseDone") {
    return (
      <View style={styles.center}>
        <Text style={styles.doneTitle}>{exerciseDoneMessage}</Text>
        <Text style={styles.exerciseName}>{doneExerciseName}</Text>
        <IronButton label="Exercice suivant →" onPress={() => setPhase("set")} />
      </View>
    );
  }

  if (phase === "resting") {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ExerciseGif gifUrl={current.gifUrl} size={100} />
        <Text style={styles.exerciseName}>{current.name}</Text>
        <Text style={styles.restLabel}>
          Pause avant la série {workout.setIndex}/{current.targetSets}
        </Text>
        <RestTimer initialSeconds={current.restDuration || 60} onFinish={() => setPhase("set")} />
        {recap}
      </ScrollView>
    );
  }

  return (
    <DismissKeyboardView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.progressLabel}>
          Exercice {workout.exerciseIndex + 1}/{workout.queue.length}
        </Text>
        <ExerciseGif gifUrl={current.gifUrl} size={120} />
        <Text style={styles.exerciseName}>{current.name}</Text>
        <Text style={styles.setCounter}>
          Série {workout.setIndex}/{current.targetSets}
        </Text>

        <View style={styles.inputsRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Poids (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.muted}
              returnKeyType="next"
              onSubmitEditing={() => repsInputRef.current?.focus()}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Répétitions</Text>
            <TextInput
              ref={repsInputRef}
              style={styles.input}
              placeholder={current.targetReps ? `Obj. ${current.targetReps}` : "0"}
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
              placeholderTextColor={Colors.muted}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <IronButton
          label="Valider la série"
          onPress={handleValidateSet}
          loading={saving}
          style={styles.fullWidth}
        />

        <TouchableOpacity onPress={handleFinishEarly} hitSlop={8}>
          <Text style={styles.finishEarlyText}>Terminer la séance maintenant</Text>
        </TouchableOpacity>

        {recap}
      </ScrollView>
    </DismissKeyboardView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
    backgroundColor: Colors.bg,
  },
  progressLabel: {
    fontFamily: FontFamily.mono,
    fontSize: 14,
    color: Colors.muted,
  },
  exerciseName: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 22,
    textTransform: "uppercase",
    color: Colors.ink,
    textAlign: "center",
  },
  setCounter: {
    fontFamily: FontFamily.monoBold,
    fontSize: 36,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  restLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.muted,
  },
  doneTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    textTransform: "uppercase",
    color: Colors.flame,
    textAlign: "center",
  },
  inputsRow: {
    flexDirection: "row",
    gap: 12,
    alignSelf: "stretch",
  },
  inputGroup: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 12,
    fontFamily: FontFamily.monoBold,
    fontSize: 22,
    color: Colors.ink,
    backgroundColor: Colors.surface,
    textAlign: "center",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  finishEarlyText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.muted,
    textDecorationLine: "underline",
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Colors.danger,
    textAlign: "center",
  },
});
