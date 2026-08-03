import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { getPrograms, deleteProgram } from "@/api/programs";

type Program = {
  id: string;
  name: string;
  description: string | null;
};

export default function HomeScreen() {
  const { user, isHydrated, hydrate } = useAuthStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, user]);

  useEffect(() => {
    if (user) {
      loadPrograms();
    }
  }, [user]);

  async function loadPrograms() {
    try {
      const data = await getPrograms();
      setPrograms(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPrograms(false);
    }
  }

  async function confirmDelete(id: string) {
    try {
      await deleteProgram(id);
      setConfirmingId(null);
      loadPrograms();
    } catch (error) {
      console.error(error);
    }
  }

  if (!isHydrated || loadingPrograms) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/create-program")}
      >
        <Text style={styles.addButtonText}>+ Nouveau programme</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.title}>Bonjour {user?.name}</Text>

        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun programme pour l'instant.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {confirmingId === item.id ? (
                <View>
                  <Text style={styles.confirmText}>
                    Supprimer "{item.name}" ? Cette action est irréversible.
                  </Text>
                  <View style={styles.confirmActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setConfirmingId(null)}
                    >
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => confirmDelete(item.id)}
                    >
                      <Text style={styles.confirmButtonText}>Confirmer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <TouchableOpacity onPress={() => router.push(`/programs/${item.id}`)}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    {item.description ? (
                      <Text style={styles.cardDescription}>{item.description}</Text>
                    ) : null}
                  </TouchableOpacity>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() =>
                        router.push({
                          pathname: "/edit-program",
                          params: {
                            id: item.id,
                            currentName: item.name,
                            currentDescription: item.description || "",
                          },
                        })
                      }
                    >
                      <Ionicons name="pencil" size={18} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => setConfirmingId(item.id)}
                    >
                      <Ionicons name="trash" size={18} color="#cc0000" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    justifyContent: "flex-end",
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  confirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cc0000",
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    padding: 10,
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
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  empty: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
  },
});