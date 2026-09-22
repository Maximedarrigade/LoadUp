import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { getPrograms, deleteProgram } from "@/api/programs";
import { getStreak } from "@/api/streak";
import StreakBadge from "@/components/StreakBadge";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius, AccentBorderWidth } from "@/theme";

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
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, user]);

  const loadPrograms = useCallback(async () => {
    try {
      const data = await getPrograms();
      setPrograms(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPrograms(false);
    }
  }, []);

  const loadStreak = useCallback(async () => {
    try {
      const data = await getStreak();
      setCurrentStreak(data.currentStreak);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadPrograms();
        loadStreak();
      }
    }, [user, loadPrograms, loadStreak])
  );

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
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.container}>
        <Text style={styles.title}>Bonjour {user?.name}</Text>
        <StreakBadge currentStreak={currentStreak} />

        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>Mes programmes</Text>
          <View style={styles.sectionLine} />
        </View>

        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 90 }}
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
                      <Ionicons name="pencil" size={18} color={Colors.ink} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => setConfirmingId(item.id)}
                    >
                      <Ionicons name="trash" size={18} color={Colors.accent} />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        />
      </View>

      <View style={styles.addButtonWrap}>
        <IronButton label="+ Nouveau programme" onPress={() => router.push("/create-program")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bg,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    textTransform: "uppercase",
    color: Colors.ink,
    marginBottom: 14,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: Colors.muted,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.line,
  },
  addButtonWrap: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: Colors.bg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.accent,
    borderRadius: Radius,
    padding: 16,
  },
  cardTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 18,
    textTransform: "uppercase",
    color: Colors.ink,
  },
  cardDescription: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.muted,
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
    borderRadius: Radius,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  confirmText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.accent,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 10,
    borderRadius: Radius,
    alignItems: "center",
  },
  cancelButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    padding: 10,
    borderRadius: Radius,
    alignItems: "center",
  },
  confirmButtonText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 14,
    color: Colors.bg,
  },
  empty: {
    fontFamily: FontFamily.body,
    textAlign: "center",
    color: Colors.muted,
    marginTop: 40,
  },
});
