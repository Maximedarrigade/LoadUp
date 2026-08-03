import { Stack } from "expo-router";
import { View } from "react-native";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <AppFooter />
    </View>
  );
}