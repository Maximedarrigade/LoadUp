import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getPrograms } from "@/api/programs";
import { applySessionTemplate, getWorkoutTemplates, type TemplateSession } from "@/api/templates";
import TemplateExerciseList, { TemplateDisclaimer, sessionTotals } from "@/components/TemplateExerciseList";
import IronButton from "@/components/IronButton";
import { Colors, FontFamily, Radius, AccentBorderWidth } from "@/theme";

type UserProgram = { id: string; name: string; days: unknown[] };

// "new" : la séance devient un nouveau programme.
type Target = string | "new";

export default function TemplateSessionsScreen() {
  const [sessions, setSessions] = useState<TemplateSession[]>([]);
  const [programs, setPrograms] = useState<UserProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chosen, setChosen] = useState<TemplateSession | null>(null);
  const [savingTarget, setSavingTarget] = useState<Target | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getWorkoutTemplates(), getPrograms()])
      .then(([templates, userPrograms]) => {
        setSessions(templates.sessions);
        setPrograms(userPrograms);
      })
      .catch((err) => {
        console.error(err);
        setLoadError("Impossible de charger les séances prêtes. Vérifie ta connexion.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(target: Target) {
    if (!chosen || savingTarget) return;
    setError("");
    setSavingTarget(target);
    try {
      const result = await applySessionTemplate(chosen.id, target === "new" ? null : target);
      // Retour à l'accueil puis ouverture du programme, pour que « retour » ramène à la liste.
      router.dismissTo("/");
      router.push(`/programs/${result.programId}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erreur lors de l'ajout de la séance.");
      setSavingTarget(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  // Étape 2 : choisir le programme où ajouter la séance.
  if (chosen) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backLink} onPress={() => setChosen(null)} hitSlop={8}>
          <Ionicons name="chevron-back" size={16} color={Colors.muted} />
          <Text style={styles.backLinkText}>Séances prêtes</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ajouter « {chosen.name} »</Text>
        <Text style={styles.subtitle}>
          {programs.length
            ? "Choisis le programme : la séance devient un nouveau jour à la fin."
            : "Tu n'as pas encore de programme : la séance devient un nouveau programme."}
        </Text>

        {programs.map((program) => (
          <TouchableOpacity
            key={program.id}
            style={styles.targetCard}
            onPress={() => handleAdd(program.id)}
            disabled={!!savingTarget}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{program.name}</Text>
              <Text style={styles.cardMeta}>
                {program.days.length} jour{program.days.length > 1 ? "s" : ""} → {program.days.length + 1}
              </Text>
            </View>
            {savingTarget === program.id ? (
              <ActivityIndicator color={Colors.accent} />
            ) : (
              <Ionicons name="add" size={22} color={Colors.accent} />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.targetCard, styles.newProgramCard]}
          onPress={() => handleAdd("new")}
          disabled={!!savingTarget}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Nouveau programme</Text>
            <Text style={styles.cardMeta}>Un programme qui contient cette seule séance.</Text>
          </View>
          {savingTarget === "new" ? (
            <ActivityIndicator color={Colors.accent} />
          ) : (
            <Ionicons name="add-circle-outline" size={22} color={Colors.accent} />
          )}
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    );
  }

  // Étape 1 : choisir une séance (toucher une carte pour voir ses exercices).
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Séances prêtes</Text>
      <TemplateDisclaimer />
      {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

      {sessions.map((session) => {
        const expanded = expandedId === session.id;
        return (
          <View key={session.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setExpandedId(expanded ? null : session.id)}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{session.name}</Text>
                <Text style={styles.cardMeta}>{session.focus}</Text>
                <Text style={styles.cardNumbers}>{sessionTotals(session.exercises)}</Text>
              </View>
              <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={Colors.muted} />
            </TouchableOpacity>
            {expanded ? (
              <>
                <TemplateExerciseList exercises={session.exercises} />
                <IronButton
                  label="Choisir cette séance"
                  onPress={() => setChosen(session)}
                  style={{ marginTop: 12 }}
                />
              </>
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
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.muted,
    marginBottom: 8,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backLinkText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
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
    gap: 12,
  },
  targetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.accent,
    borderRadius: Radius,
    padding: 16,
  },
  newProgramCard: {
    borderLeftColor: Colors.flame,
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
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Colors.danger,
    textAlign: "center",
  },
});
