import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { login } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius } from "@/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const setAuth = useAuthStore((state) => state.setAuth);

  async function handleLogin() {
    setError("");
    try {
      const data = await login(email, password);
      setAuth(data.user, data.token);
      router.replace("/");
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LoadUp</Text>

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
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={Colors.muted}
        maxLength={72}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <IronButton label="Se connecter" onPress={handleLogin} style={{ marginTop: 12 }} />

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.linkText}>Pas encore de compte ? S'inscrire</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/forgot-password")}>
        <Text style={styles.linkText}>Mot de passe oublié ?</Text>
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
    fontSize: 36,
    textTransform: "uppercase",
    textAlign: "center",
    color: Colors.ink,
    marginBottom: 24,
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
