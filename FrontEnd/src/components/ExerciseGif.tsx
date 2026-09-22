import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/theme";

type ExerciseGifProps = {
  gifUrl?: string | null;
  size?: number;
};

export default function ExerciseGif({ gifUrl, size = 60 }: ExerciseGifProps) {
  const [hasError, setHasError] = useState(false);

  if (!gifUrl) return null;

  if (hasError) {
    return (
      <View style={[styles.image, styles.fallback, { width: size, height: size }]}>
        <Ionicons name="barbell" size={size * 0.5} color={Colors.muted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: gifUrl }}
      style={[styles.image, { width: size, height: size }]}
      contentFit="cover"
      autoplay
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
