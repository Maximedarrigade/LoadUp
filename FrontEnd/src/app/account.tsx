import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { deleteAccount, updateProfile } from "@/api/auth";
import DismissKeyboardView from "@/components/DismissKeyboardView";

export default function AccountScreen() {
  const { user, token, logout, setAuth } = useAuthStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  function startEditing() {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setError("");
    setSuccess("");
    setEditing(true);
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim()) {
      setError("Le nom et l'email sont requis.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile({ name: name.trim(), email: email.trim() });
      if (token) {
        setAuth({ id: updated.id, name: updated.name, email: updated.email }, token);
      }
      setEditing(false);
      setSuccess("Profil mis à jour avec succès.");
    } catch (err: any) {
      const message = err?.response?.data?.error || "Erreur lors de la mise à jour du profil.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setError("");
    try {
      await deleteAccount();
      logout();
      router.replace("/login");
    } catch (err) {
      setError("Erreur lors de la suppression du compte.");
    }
  }

  return (
    <DismissKeyboardView style={styles.container}>
      <Text style={styles.title}>Mon compte</Text>

      {editing ? (
        <View style={styles.editBlock}>
          <TextInput
            style={styles.input}
            placeholder="Nom"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#888"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#888"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditing(false);
                setError("");
              }}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveButtonText}>{saving ? "Enregistrement..." : "Enregistrer"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {success ? <Text style={styles.success}>{success}</Text> : null}

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Nom</Text>
            <Text style={styles.value}>{user?.name}</Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={startEditing}>
            <Text style={styles.editButtonText}>Modifier mon profil</Text>
          </TouchableOpacity>
        </>
      )}

      {confirmingDelete ? (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>
            Supprimer ton compte supprimera définitivement tous tes programmes et
            ton historique. Cette action est irréversible.
          </Text>
          {error && !editing ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setConfirmingDelete(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.confirmButtonText}>Confirmer la suppression</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setConfirmingDelete(true)}
        >
          <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
        </TouchableOpacity>
      )}
    </DismissKeyboardView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 12,
  },
  infoBlock: {
    backgroundColor: "#f2f2f2",
    padding: 14,
    borderRadius: 10,
  },
  label: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: "#eee",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  editButtonText: {
    fontWeight: "600",
    fontSize: 15,
  },
  editBlock: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  success: {
    color: "#0a8a0a",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: "#ffe5e5",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  deleteButtonText: {
    color: "#cc0000",
    fontWeight: "600",
    fontSize: 15,
  },
  confirmBox: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#fff0f0",
    borderRadius: 10,
    gap: 10,
  },
  confirmText: {
    fontSize: 14,
    color: "#cc0000",
    fontWeight: "600",
  },
  error: {
    color: "red",
    fontSize: 13,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#cc0000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
