import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontFamily, Radius, AccentBorderWidth } from "@/theme";

type Choice = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
};

const CHOICES: Choice[] = [
  {
    title: "Créer mon programme",
    description: "Je choisis mes exercices moi-même.",
    icon: "create-outline",
    href: "/create-program",
  },
  {
    title: "Ajouter une séance prête",
    description: "Une séance déjà remplie, à mettre dans un de mes programmes.",
    icon: "barbell-outline",
    href: "/template-sessions",
  },
  {
    title: "Prendre un programme prêt",
    description: "Un programme complet, déjà rempli.",
    icon: "calendar-outline",
    href: "/template-programs",
  },
];

export default function NewProgramScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nouveau programme</Text>

      {CHOICES.map((choice) => (
        <TouchableOpacity
          key={choice.title}
          style={styles.card}
          onPress={() => router.push(choice.href)}
          activeOpacity={0.85}
        >
          <Ionicons name={choice.icon} size={26} color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{choice.title}</Text>
            <Text style={styles.cardDescription}>{choice.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    gap: 12,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    textTransform: "uppercase",
    color: Colors.ink,
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
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
});
