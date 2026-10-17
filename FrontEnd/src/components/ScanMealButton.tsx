import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getPhotoQuota, PhotoQuota } from "@/api/photoAnalysis";
import { pickPhoto } from "@/utils/photo";
import { setPendingPhoto } from "@/store/pendingPhoto";
import { Colors, FontFamily, Radius, AccentBorderWidth } from "@/theme";

type Props = {
  /** Version plus discrète (accueil). */
  compact?: boolean;
};

/**
 * Bouton « Scanner mon assiette » : ouvre directement l'appareil photo puis l'écran d'analyse.
 * PWA uniquement (input fichier du navigateur).
 */
export default function ScanMealButton({ compact }: Props) {
  const [quota, setQuota] = useState<PhotoQuota | null>(null);

  useFocusEffect(
    useCallback(() => {
      getPhotoQuota()
        .then(setQuota)
        .catch(() => setQuota(null));
    }, [])
  );

  if (Platform.OS !== "web") return null;

  const exhausted = quota !== null && quota.remainingToday === 0;

  async function handlePress() {
    // Appelé directement dans le geste : condition pour que Safari iOS ouvre l'appareil photo.
    const file = await pickPhoto();
    if (!file) return;
    setPendingPhoto(file);
    router.push("/scan-meal");
  }

  return (
    <TouchableOpacity
      style={[styles.button, compact && styles.compact, exhausted && styles.exhausted]}
      onPress={handlePress}
      disabled={exhausted}
      activeOpacity={0.85}
    >
      <Text style={[styles.label, compact && styles.labelCompact]}>📸 Scanner mon assiette</Text>
      {quota ? (
        <Text style={styles.quota}>
          {exhausted ? (
            "Limite du jour atteinte"
          ) : (
            <>
              <Text style={styles.quotaNumber}>{quota.remainingToday}</Text>/{quota.limit} analyses
              restantes aujourd'hui
            </>
          )}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderLeftWidth: AccentBorderWidth,
    borderLeftColor: Colors.accent,
    borderRadius: Radius,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 4,
  },
  compact: {
    paddingVertical: 10,
  },
  exhausted: {
    opacity: 0.5,
  },
  label: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 17,
    textTransform: "uppercase",
    color: Colors.ink,
    letterSpacing: 0.4,
  },
  labelCompact: {
    fontSize: 15,
  },
  quota: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.muted,
  },
  quotaNumber: {
    fontFamily: FontFamily.monoBold,
    color: Colors.ink,
  },
});
