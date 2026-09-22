import { useFonts } from "expo-font";
import { Oswald_600SemiBold, Oswald_700Bold } from "@expo-google-fonts/oswald";
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

/**
 * "Iron Log" — familles de polices.
 * - Oswald (condensé, MAJUSCULES) : titres d'écran, noms de programmes/exercices.
 * - JetBrains Mono (tabular nums) : tous les chiffres (poids, reps, chronos, dates).
 * - Inter : texte courant, labels, boutons secondaires.
 */
export const FontFamily = {
  headingSemiBold: "Oswald_600SemiBold",
  headingBold: "Oswald_700Bold",
  mono: "JetBrainsMono_500Medium",
  monoBold: "JetBrainsMono_700Bold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
} as const;

/** Charge les polices Iron Log. Tant que `fontsLoaded` est false, ne pas rendre l'UI stylée. */
export function useAppFonts() {
  const [fontsLoaded] = useFonts({
    Oswald_600SemiBold,
    Oswald_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return fontsLoaded;
}
