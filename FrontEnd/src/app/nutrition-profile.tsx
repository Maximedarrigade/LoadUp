import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  GestureResponderEvent,
  Platform,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  getNutritionProfile,
  saveNutritionProfile,
  ActivityLevel,
  Gender,
  Goal,
} from "@/api/nutritionProfile";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Homme" },
  { value: "female", label: "Femme" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sédentaire (peu/pas de sport)" },
  { value: "light", label: "Légèrement actif (1-3x/semaine)" },
  { value: "moderate", label: "Modérément actif (3-5x/semaine)" },
  { value: "active", label: "Très actif (6-7x/semaine)" },
];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "cut", label: "Sèche" },
  { value: "bulk", label: "Prise de masse" },
];

export default function NutritionProfileScreen() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("cut");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const heightInputRef = useRef<TextInput>(null);
  const ageInputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      getNutritionProfile()
        .then((profile) => {
          setWeight(String(profile.weight));
          setHeight(String(profile.height));
          setAge(String(profile.age));
          setGender(profile.gender);
          setActivityLevel(profile.activityLevel);
          setGoal(profile.goal);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [])
  );

  async function handleSubmit() {
    setError("");
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    const ageNum = parseInt(age, 10);

    if (!weightNum || !heightNum || !ageNum) {
      setError("Merci de remplir tous les champs correctement.");
      return;
    }

    try {
      await saveNutritionProfile({
        weight: weightNum,
        height: heightNum,
        age: ageNum,
        gender,
        activityLevel,
        goal,
      });
      router.replace("/nutrition");
    } catch (err) {
      setError("Erreur lors de l'enregistrement du profil.");
    }
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  function handleOutsidePress(event: GestureResponderEvent) {
    // On web, a tap on a nested TextInput fires a click that bubbles up to
    // this wrapper too. Only dismiss when the tap landed on the wrapper
    // itself, otherwise the keyboard we just opened gets closed immediately.
    if (Platform.OS !== "web" || event.target === event.currentTarget) {
      Keyboard.dismiss();
    }
  }

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress} accessible={false}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Mon profil nutritionnel</Text>

      <TextInput
        style={styles.input}
        placeholder="Poids (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholderTextColor="#888"
        returnKeyType="next"
        onSubmitEditing={() => heightInputRef.current?.focus()}
      />
      <TextInput
        ref={heightInputRef}
        style={styles.input}
        placeholder="Taille (cm)"
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
        placeholderTextColor="#888"
        returnKeyType="next"
        onSubmitEditing={() => ageInputRef.current?.focus()}
      />
      <TextInput
        ref={ageInputRef}
        style={styles.input}
        placeholder="Âge"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        placeholderTextColor="#888"
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />

      <Text style={styles.sectionLabel}>Sexe</Text>
      <View style={styles.optionsRow}>
        {GENDER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, gender === option.value && styles.chipActive]}
            onPress={() => setGender(option.value)}
          >
            <Text style={[styles.chipText, gender === option.value && styles.chipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Niveau d'activité</Text>
      <View style={styles.optionsColumn}>
        {ACTIVITY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, activityLevel === option.value && styles.chipActive]}
            onPress={() => setActivityLevel(option.value)}
          >
            <Text
              style={[styles.chipText, activityLevel === option.value && styles.chipTextActive]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Objectif</Text>
      <View style={styles.optionsRow}>
        {GOAL_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, goal === option.value && styles.chipActive]}
            onPress={() => setGoal(option.value)}
          >
            <Text style={[styles.chipText, goal === option.value && styles.chipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Enregistrer</Text>
      </TouchableOpacity>
    </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
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
    color: "#000",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    color: "#333",
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  optionsColumn: {
    gap: 8,
  },
  chip: {
    backgroundColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: "#000",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  chipTextActive: {
    color: "#fff",
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
    marginTop: 16,
    marginBottom: 40,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
