import { useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/theme";

type ExerciseThumbnailProps = {
  exerciseId?: string | null;
  gifUrl?: string | null;
  size?: number;
};

// Sur le web (PWA), les miniatures statiques sont générées par
// BackEnd/src/scripts/generateExerciseThumbnails.ts et servies depuis /thumbs.
// Sur natif (Expo Go), elles ne sont pas hébergées : on affiche la 1re image du GIF.
export default function ExerciseThumbnail({ exerciseId, gifUrl, size = 56 }: ExerciseThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  const uri = Platform.OS === "web" && exerciseId ? `/thumbs/${exerciseId}.webp` : gifUrl;
  if (!uri) return null;

  if (hasError) {
    return (
      <View style={[styles.image, styles.fallback, { width: size, height: size }]}>
        <Ionicons name="barbell" size={size * 0.5} color={Colors.muted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.image, { width: size, height: size }]}
      contentFit="cover"
      autoplay={false}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: Radius,
    backgroundColor: Colors.surface,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.line,
  },
});
