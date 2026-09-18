import { PropsWithChildren } from "react";
import { Keyboard, TouchableWithoutFeedback, View, ViewStyle, StyleProp } from "react-native";

type DismissKeyboardViewProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export default function DismissKeyboardView({ children, style }: DismissKeyboardViewProps) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[{ flex: 1 }, style]}>{children}</View>
    </TouchableWithoutFeedback>
  );
}
