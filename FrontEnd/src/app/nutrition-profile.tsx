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
import SectionLabel from "@/components/SectionLabel";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius } from "@/theme";

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
        style={[styles.input, styles.numericInput]}
        placeholder="Poids (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholderTextColor={Colors.muted}
        returnKeyType="next"
        onSubmitEditing={() => heightInputRef.current?.focus()}
      />
      <TextInput
        ref={heightInputRef}
        style={[styles.input, styles.numericInput]}
        placeholder="Taille (cm)"
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
        placeholderTextColor={Colors.muted}
        returnKeyType="next"
        onSubmitEditing={() => ageInputRef.current?.focus()}
      />
      <TextInput
        ref={ageInputRef}
        style={[styles.input, styles.numericInput]}
        placeholder="Âge"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        placeholderTextColor={Colors.muted}
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />

      <SectionLabel style={styles.sectionLabel}>Sexe</SectionLabel>
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

      <SectionLabel style={styles.sectionLabel}>Niveau d'activité</SectionLabel>
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

      <SectionLabel style={styles.sectionLabel}>Objectif</SectionLabel>
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

      <IronButton
        label="Enregistrer"
        onPress={handleSubmit}
        style={{ marginTop: 16, marginBottom: 40 }}
      />
    </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
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
  sectionLabel: {
    marginTop: 10,
    marginBottom: 2,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.ink,
  },
  chipTextActive: {
    color: Colors.bg,
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Colors.accent,
    textAlign: "center",
  },
});
