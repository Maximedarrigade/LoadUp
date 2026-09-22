import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { deleteAccount, updateProfile } from "@/api/auth";
import DismissKeyboardView from "@/components/DismissKeyboardView";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius } from "@/theme";

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
            <IronButton
              label={saving ? "Enregistrement..." : "Enregistrer"}
              onPress={handleSave}
              disabled={saving}
              loading={saving}
              style={{ flex: 1 }}
            />
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
    paddingTop: 40,
    gap: 16,
    backgroundColor: Colors.bg,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    textTransform: "uppercase",
    color: Colors.ink,
    marginBottom: 12,
  },
  infoBlock: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 14,
    borderRadius: Radius,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.muted,
    marginBottom: 4,
  },
  value: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.ink,
  },
  editButton: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 14,
    borderRadius: Radius,
    alignItems: "center",
  },
  editButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  editBlock: {
    gap: 10,
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
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  success: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.flame,
    fontSize: 13,
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent,
    padding: 14,
    borderRadius: Radius,
    alignItems: "center",
    marginTop: 20,
  },
  deleteButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.accent,
    fontSize: 15,
  },
  confirmBox: {
    marginTop: 20,
    padding: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius,
    gap: 10,
  },
  confirmText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.accent,
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Colors.accent,
    fontSize: 13,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 12,
    borderRadius: Radius,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    padding: 12,
    borderRadius: Radius,
    alignItems: "center",
  },
  confirmButtonText: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.bg,
    fontSize: 13,
  },
});
