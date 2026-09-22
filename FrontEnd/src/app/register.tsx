import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { register, login } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius } from "@/theme";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const setAuth = useAuthStore((state) => state.setAuth);

  async function handleRegister() {
    setError("");

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Merci de remplir tous les champs.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      await register(email, password, name);
      const data = await login(email, password);
      setAuth(data.user, data.token);
      router.replace("/");
    } catch (err: any) {
      const message = err?.response?.data?.error || "Erreur lors de l'inscription.";
      setError(message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom"
        value={name}
        onChangeText={setName}
        placeholderTextColor={Colors.muted}
        maxLength={50}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={Colors.muted}
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe (8 caractères min.)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={Colors.muted}
        maxLength={72}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmation du mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor={Colors.muted}
        maxLength={72}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <IronButton label="S'inscrire" onPress={handleRegister} style={{ marginTop: 12 }} />

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
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
    fontSize: 30,
    textTransform: "uppercase",
    textAlign: "center",
    color: Colors.ink,
    marginBottom: 20,
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
  linkText: {
    fontFamily: FontFamily.bodyMedium,
    textAlign: "center",
    color: Colors.accent,
    marginTop: 16,
    fontSize: 14,
  },
});
