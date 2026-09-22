import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { forgotPassword } from "@/api/auth";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius } from "@/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Merci de renseigner ton email.");
      return;
    }

    try {
      const data = await forgotPassword(email);
      setMessage(data.message);
    } catch (err) {
      setError("Erreur lors de l'envoi. Réessaie plus tard.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.subtitle}>
        Renseigne ton email, tu recevras un lien pour réinitialiser ton mot de passe.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={Colors.muted}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <IronButton label="Envoyer le lien" onPress={handleSubmit} style={{ marginTop: 12 }} />

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={styles.linkText}>Retour à la connexion</Text>
      </TouchableOpacity>
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
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
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
  success: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.flame,
    textAlign: "center",
  },
  linkText: {
    fontFamily: FontFamily.bodyMedium,
    textAlign: "center",
    color: Colors.accent,
    marginTop: 16,
    fontSize: 14,
  },
});
