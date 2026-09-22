import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Keyboard, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { createWorkoutLog } from "@/api/workouts";
import RestTimer from "@/components/RestTimer";
import ExerciseGif from "@/components/ExerciseGif";
import DismissKeyboardView from "@/components/DismissKeyboardView";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius } from "@/theme";

type Phase = "set" | "resting" | "form" | "done";

type QueueExercise = {
  id: string;
  name: string;
  targetSets: number;
  restDuration: number;
  gifUrl?: string | null;
};

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

export default function LogWorkoutScreen() {
  const { programId, exerciseIndex, exercisesQueue } = useLocalSearchParams<{
    programId: string;
    exerciseIndex: string;
    exercisesQueue: string;
  }>();

  const queue: QueueExercise[] = JSON.parse(exercisesQueue || "[]");
  const index = parseInt(exerciseIndex || "0", 10);
  const current = queue[index];

  const totalSets = current?.targetSets || 1;
  const rest = current?.restDuration || 60;
  const isLastExercise = index >= queue.length - 1;

  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<Phase>("set");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [error, setError] = useState("");
  const repsInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    setCurrentSet(1);
    setPhase("set");
    setWeight("");
    setReps("");
    setError("");
  }, [current?.id]);

  function handleValidateSet() {
    if (currentSet < totalSets) {
      setPhase("resting");
    } else {
      setPhase("form");
    }
  }

  function handleRestFinished() {
    setCurrentSet((prev) => prev + 1);
    setPhase("set");
  }

  async function handleSubmit() {
    setError("");
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps, 10);

    if (isNaN(weightNum) || isNaN(repsNum)) {
      setError("Merci de remplir le poids et les répétitions.");
      return;
    }

    try {
      await createWorkoutLog(current.id, weightNum, repsNum, totalSets);
      setPhase("done");
    } catch (err) {
      setError("Erreur lors de l'enregistrement.");
    }
  }

  function handleNextExercise() {
    router.replace({
      pathname: "/log-workout",
      params: {
        programId,
        exerciseIndex: String(index + 1),
        exercisesQueue,
      },
    });
  }

  function handleBackToProgram() {
    router.replace(`/programs/${programId}`);
  }

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={styles.exerciseName}>Exercice introuvable.</Text>
      </View>
    );
  }

  if (phase === "set") {
    return (
      <View style={styles.center}>
        <Text style={styles.progressLabel}>
          Exercice {index + 1}/{queue.length}
        </Text>
        <ExerciseGif gifUrl={current.gifUrl} size={140} />
        <Text style={styles.exerciseName}>{current.name}</Text>
        <Text style={styles.setCounter}>
          Série {currentSet}/{totalSets}
        </Text>
        <IronButton label="Valider la série" onPress={handleValidateSet} />
      </View>
    );
  }

  if (phase === "resting") {
    return (
      <View style={styles.center}>
        <ExerciseGif gifUrl={current.gifUrl} size={100} />
        <Text style={styles.exerciseName}>{current.name}</Text>
        <Text style={styles.restLabel}>
          Pause avant la série {currentSet + 1}/{totalSets}
        </Text>
        <RestTimer initialSeconds={rest} onFinish={handleRestFinished} />
      </View>
    );
  }

  if (phase === "form") {
    return (
      <DismissKeyboardView style={styles.container}>
        <Text style={styles.exerciseName}>{current.name}</Text>
        <Text style={styles.setCounter}>Toutes les séries terminées 💪</Text>

        <TextInput
          style={styles.input}
          placeholder="Poids utilisé (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholderTextColor={Colors.muted}
          returnKeyType="next"
          onSubmitEditing={() => repsInputRef.current?.focus()}
        />
        <TextInput
          ref={repsInputRef}
          style={styles.input}
          placeholder="Répétitions faites (dernière série)"
          value={reps}
          onChangeText={setReps}
          keyboardType="numeric"
          placeholderTextColor={Colors.muted}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <IronButton label="Enregistrer" onPress={handleSubmit} />
      </DismissKeyboardView>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.doneTitle}>
        {isLastExercise
          ? DAY_DONE_MESSAGES[Math.floor(Math.random() * DAY_DONE_MESSAGES.length)]
          : EXERCISE_DONE_MESSAGES[Math.floor(Math.random() * EXERCISE_DONE_MESSAGES.length)]}
      </Text>
      <Text style={styles.exerciseName}>{current.name}</Text>

      {isLastExercise ? (
        <IronButton label="Retour au programme" onPress={handleBackToProgram} />
      ) : (
        <IronButton label="Exercice suivant →" onPress={handleNextExercise} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: Colors.bg,
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
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 12,
    fontFamily: FontFamily.mono,
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
