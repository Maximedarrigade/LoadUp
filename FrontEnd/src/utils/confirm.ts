import { Platform, Alert } from "react-native";

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = "Supprimer"
) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel" },
      { text: confirmLabel, style: "destructive", onPress: onConfirm },
    ]);
  }
}