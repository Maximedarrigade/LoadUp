import { PropsWithChildren } from "react";
import {
  GestureResponderEvent,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";

type DismissKeyboardViewProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

// On web, a tap on a nested TextInput fires a click that bubbles up to this
// container too. Only dismiss when the tap landed on the container itself,
// otherwise the keyboard we just opened gets closed again immediately.
function handleOutsidePress(event: GestureResponderEvent) {
  if (Platform.OS !== "web" || event.target === event.currentTarget) {
    Keyboard.dismiss();
  }
}

export default function DismissKeyboardView({ children, style }: DismissKeyboardViewProps) {
  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress} accessible={false}>
      <View style={[{ flex: 1 }, style]}>{children}</View>
    </TouchableWithoutFeedback>
  );
}
