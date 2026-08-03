import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { deleteAccount } from "@/api/auth";

export default function AccountScreen() {
  const { user, logout } = useAuthStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");

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
    <View style={styles.container}>
      <Text style={styles.title}>Mon compte</Text>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Nom</Text>
        <Text style={styles.value}>{user?.name}</Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>

      {confirmingDelete ? (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>
            Supprimer ton compte supprimera définitivement tous tes programmes et
            ton historique. Cette action est irréversible.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
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
    </View>
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