import { useRef, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { resetPassword } from "@/api/auth";
import IronButton from "@/components/IronButton";
import { authErrorMessage } from "@/utils/authError";
import { Colors, FontFamily, Radius } from "@/theme";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Garde synchrone : deux appuis rapprochés ne doivent envoyer qu'une requête.
  const submittingRef = useRef(false);

  async function handleSubmit() {
    if (submittingRef.current) return;
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(authErrorMessage(err, { fallback: "Erreur lors de la réinitialisation." }));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mot de passe modifié ✅</Text>
        <IronButton label="Se connecter" onPress={() => router.replace("/login")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouveau mot de passe</Text>

      <TextInput
        style={styles.input}
        placeholder="Nouveau mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={Colors.muted}
        maxLength={72}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor={Colors.muted}
        maxLength={72}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <IronButton label="Réinitialiser" onPress={handleSubmit} loading={submitting} style={{ marginTop: 12 }} />
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
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    textTransform: "uppercase",
    textAlign: "center",
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
