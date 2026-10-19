import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  applyProgramTemplate,
  getWorkoutTemplates,
  type TemplateProgram,
  type TemplateSession,
} from "@/api/templates";
import TemplateExerciseList, { TemplateDisclaimer, sessionTotals } from "@/components/TemplateExerciseList";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius, AccentBorderWidth } from "@/theme";

export default function TemplateProgramsScreen() {
  const [programs, setPrograms] = useState<TemplateProgram[]>([]);
  const [sessions, setSessions] = useState<TemplateSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Jour dont on affiche les exercices, sous la forme "programme#index".
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkoutTemplates()
      .then((templates) => {
        setPrograms(templates.programs);
        setSessions(templates.sessions);
      })
      .catch((err) => {
        console.error(err);
        setLoadError("Impossible de charger les programmes prêts. Vérifie ta connexion.");
      })
      .finally(() => setLoading(false));
  }, []);

  const sessionsById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  async function handleCreate(program: TemplateProgram) {
    if (savingId) return;
    setError("");
    setSavingId(program.id);
    try {
      const result = await applyProgramTemplate(program.id);
      // Retour à l'accueil puis ouverture du programme, pour que « retour » ramène à la liste.
      router.dismissTo("/");
      router.push(`/programs/${result.programId}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erreur lors de la création du programme.");
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Programmes prêts</Text>
      <TemplateDisclaimer />
      {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

      {programs.map((program) => {
        const expanded = expandedId === program.id;
        return (
          <View key={program.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setExpandedId(expanded ? null : program.id)}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{program.name}</Text>
                <Text style={styles.cardMeta}>{program.description}</Text>
                <Text style={styles.cardNumbers}>
                  {program.days.length} jours · {program.days.map((day) => day.name).join(" · ")}
                </Text>
              </View>
              <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={Colors.muted} />
            </TouchableOpacity>

            {expanded ? (
              <View style={styles.days}>
                {program.days.map((day, index) => {
                  const session = sessionsById.get(day.sessionId);
                  const key = `${program.id}#${index}`;
                  const dayOpen = openDay === key;
                  return (
                    <View key={key} style={styles.day}>
                      <TouchableOpacity
                        style={styles.dayHeader}
                        onPress={() => setOpenDay(dayOpen ? null : key)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.dayIndex}>J{index + 1}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dayName}>{day.name}</Text>
                          {session ? <Text style={styles.cardNumbers}>{sessionTotals(session.exercises)}</Text> : null}
                        </View>
                        <Ionicons name={dayOpen ? "chevron-up" : "chevron-down"} size={18} color={Colors.muted} />
                      </TouchableOpacity>
                      {dayOpen && session ? <TemplateExerciseList exercises={session.exercises} /> : null}
                    </View>
                  );
                })}

                <IronButton
                  label="Créer ce programme"
                  onPress={() => handleCreate(program)}
                  loading={savingId === program.id}
                  disabled={!!savingId && savingId !== program.id}
                  style={{ marginTop: 4 }}
                />
                {error && savingId === null ? <Text style={styles.error}>{error}</Text> : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    gap: 12,
    paddingBottom: 40,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    textTransform: "uppercase",
    color: Colors.ink,
    marginBottom: 4,
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
    gap: 12,
  },
  cardTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 18,
    textTransform: "uppercase",
    color: Colors.ink,
  },
  cardMeta: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.muted,
    marginTop: 4,
  },
  cardNumbers: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 6,
  },
  days: {
    marginTop: 14,
    gap: 8,
  },
  day: {
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    paddingTop: 10,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayIndex: {
    fontFamily: FontFamily.monoBold,
    fontSize: 14,
    color: Colors.accent,
    width: 26,
  },
  dayName: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 15,
    textTransform: "uppercase",
    color: Colors.ink,
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Colors.danger,
    textAlign: "center",
    marginTop: 8,
  },
});
