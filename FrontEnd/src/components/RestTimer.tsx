import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Colors, FontFamily, Radius } from "@/theme";

type RestTimerProps = {
  initialSeconds: number;
  onFinish?: () => void;
};

export default function RestTimer({ initialSeconds, onFinish }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0) {
      notifyEndOfRest();
      if (onFinish) onFinish();
    }
  }, [secondsLeft]);

  function notifyEndOfRest() {
    // Vibration (fonctionne sur web mobile + natif)
    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(400);
      }

      // Son simple via l'API Web Audio (bip généré, pas besoin de fichier externe)
      try {
        const AudioContextClass =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.log("Son non disponible", e);
      }

      // Notification navigateur (nécessite la permission utilisateur)
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("LoadUp", { body: "Pause terminée, pousse fainéant" });
      }
    }
  }

  function toggle() {
    setIsRunning((prev) => !prev);
  }

  function reset() {
    setSecondsLeft(initialSeconds);
    setIsRunning(true);
  }

  function addTime(seconds: number) {
    setSecondsLeft((prev) => Math.max(0, prev + seconds));
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{display}</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.smallButton} onPress={() => addTime(-10)}>
          <Text style={styles.smallButtonText}>-10s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton} onPress={() => addTime(10)}>
          <Text style={styles.smallButtonText}>+10s</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.mainButton} onPress={toggle}>
        <Text style={styles.mainButtonText}>{isRunning ? "Pause" : "Reprendre"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={reset}>
        <Text style={styles.resetText}>Réinitialiser</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  time: {
    fontFamily: FontFamily.monoBold,
    fontSize: 64,
    color: Colors.flame,
    fontVariant: ["tabular-nums"],
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  smallButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius,
  },
  smallButtonText: {
    fontFamily: FontFamily.mono,
    fontSize: 14,
    color: Colors.ink,
  },
  mainButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: Radius,
  },
  mainButtonText: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.bg,
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  resetText: {
    fontFamily: FontFamily.bodyMedium,
    color: Colors.muted,
    fontSize: 14,
  },
});
