import { useCallback, useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import Sortable, { type SortableGridDragEndParams } from "react-native-sortables";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { getPrograms, deleteProgram, reorderPrograms } from "@/api/programs";
import { getStreak, getWeekSummary, type WeekSummary } from "@/api/streak";
import { finishWorkoutSession, getCurrentWorkoutSession } from "@/api/workouts";
import { clearActiveWorkout, loadActiveWorkout, type ActiveWorkout } from "@/store/activeWorkout";
import { confirmAction } from "@/utils/confirm";
import StreakBadge from "@/components/StreakBadge";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius, AccentBorderWidth } from "@/theme";

type Program = {
  id: string;
  name: string;
  description: string | null;
};

// Volume arrondi au kilo, avec séparateur de milliers : 12450 → "12 450".
function formatVolume(volume: number) {
  return Math.round(volume)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
}

export default function HomeScreen() {
  const { user, isHydrated, hydrate } = useAuthStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  const [reorderError, setReorderError] = useState("");
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

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

  const loadWeekSummary = useCallback(async () => {
    try {
      setWeekSummary(await getWeekSummary());
    } catch (error) {
      console.error(error);
    }
  }, []);

  // Séance démarrée mais pas terminée (appli fermée en cours de route) : on propose de la reprendre.
  const loadActiveWorkoutBanner = useCallback(async () => {
    const local = await loadActiveWorkout();
    if (!local) {
      setActiveWorkout(null);
      return;
    }
    try {
      const session = await getCurrentWorkoutSession();
      if (!session || session.id !== local.sessionId) {
        await clearActiveWorkout();
        setActiveWorkout(null);
        return;
      }
    } catch (error) {
      // Hors ligne : on se fie à l'état local et on propose quand même la reprise.
      console.error(error);
    }
    setActiveWorkout(local);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadPrograms();
        loadStreak();
        loadActiveWorkoutBanner();
        loadWeekSummary();
      }
    }, [user, loadPrograms, loadStreak, loadActiveWorkoutBanner, loadWeekSummary])
  );

  function handleAbandonWorkout() {
    if (!activeWorkout) return;
    const { sessionId } = activeWorkout;
    confirmAction(
      "Abandonner la séance en cours ?",
      "Les séries déjà validées restent enregistrées.",
      async () => {
        try {
          await finishWorkoutSession(sessionId);
        } catch (error) {
          // Sans réseau, la séance sera clôturée côté API au prochain démarrage de séance.
          console.error(error);
        }
        await clearActiveWorkout();
        setActiveWorkout(null);
      },
      "Abandonner"
    );
  }

  // Glisser-déposer : on affiche le nouvel ordre tout de suite, puis on l'enregistre.
  // En cas d'échec, on recharge la liste depuis l'API pour revenir à l'ordre enregistré.
  async function handleProgramsDragEnd({ data }: SortableGridDragEndParams<Program>) {
    if (data === programs) return;
    setPrograms(data);
    setReorderError("");
    try {
      await reorderPrograms(data.map((program) => program.id));
    } catch (error) {
      console.error(error);
      setReorderError("Nouvel ordre non enregistré. Réessaie.");
      loadPrograms();
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

  const renderProgram = ({ item }: { item: Program }) => (
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
          <View style={styles.cardHeader}>
            {programs.length > 1 ? (
              <Sortable.Handle>
                <View style={styles.dragHandle}>
                  <Ionicons name="reorder-three" size={24} color={Colors.muted} />
                </View>
              </Sortable.Handle>
            ) : null}
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => router.push(`/programs/${item.id}`)}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.cardDescription}>{item.description}</Text>
              ) : null}
            </TouchableOpacity>
          </View>

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
  );

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

        {activeWorkout ? (
          <View style={styles.resumeCard}>
            <Text style={styles.resumeLabel}>Séance en cours</Text>
            <Text style={styles.cardTitle}>{activeWorkout.dayName}</Text>
            <Text style={styles.resumeProgress}>
              {activeWorkout.exerciseIndex >= activeWorkout.queue.length
                ? "Toutes les séries sont faites"
                : `Exercice ${activeWorkout.exerciseIndex + 1}/${activeWorkout.queue.length} · Série ${activeWorkout.setIndex}`}
            </Text>
            <IronButton
              label="Reprendre la séance en cours"
              onPress={() => router.push("/log-workout")}
              style={styles.resumeButton}
            />
            <TouchableOpacity onPress={handleAbandonWorkout} style={styles.resumeAbandon} hitSlop={8}>
              <Text style={styles.resumeAbandonText}>Abandonner</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>Cette semaine</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.weekRow}>
          <View style={styles.weekTile}>
            <Text style={styles.weekValue}>{weekSummary ? weekSummary.sessionCount : "–"}</Text>
            <Text style={styles.weekLabel}>
              {weekSummary?.sessionCount === 1 ? "Séance" : "Séances"}
            </Text>
          </View>
          <View style={styles.weekTile}>
            <Text style={styles.weekValue} numberOfLines={1} adjustsFontSizeToFit>
              {weekSummary ? formatVolume(weekSummary.totalVolume) : "–"}
              <Text style={styles.weekUnit}> kg</Text>
            </Text>
            <Text style={styles.weekLabel}>Volume soulevé</Text>
          </View>
        </View>

        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>Mes programmes</Text>
          <View style={styles.sectionLine} />
        </View>

        {reorderError ? <Text style={styles.reorderError}>{reorderError}</Text> : null}

        <Animated.ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 90 }}>
          {programs.length === 0 ? (
            <Text style={styles.empty}>Aucun programme pour l'instant.</Text>
          ) : (
            <Sortable.Grid
              columns={1}
              rowGap={12}
              data={programs}
              keyExtractor={(item) => item.id}
              renderItem={renderProgram}
              onDragEnd={handleProgramsDragEnd}
              scrollableRef={scrollRef}
              customHandle
            />
          )}
        </Animated.ScrollView>
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
  weekRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  weekTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  weekValue: {
    fontFamily: FontFamily.monoBold,
    fontSize: 26,
    color: Colors.ink,
    fontVariant: ["tabular-nums"],
  },
  weekUnit: {
    fontFamily: FontFamily.mono,
    fontSize: 14,
    color: Colors.muted,
  },
  weekLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.muted,
  },
  resumeCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.flame,
    borderRadius: Radius,
    padding: 16,
    marginBottom: 20,
  },
  resumeLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: Colors.flame,
    marginBottom: 4,
  },
  resumeProgress: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
    color: Colors.muted,
    marginTop: 4,
  },
  resumeButton: {
    marginTop: 14,
  },
  resumeAbandon: {
    alignItems: "center",
    paddingTop: 12,
  },
  resumeAbandonText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.muted,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dragHandle: {
    paddingVertical: 4,
    paddingRight: 4,
  },
  reorderError: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.danger,
    marginBottom: 8,
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
