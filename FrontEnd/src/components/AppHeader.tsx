import { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { Colors, FontFamily, Radius } from "@/theme";
import wordmark from "@/assets/images/white_c_wordmark.png";

export default function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  function navigateAndClose(path: string) {
    setMenuOpen(false);
    router.push(path as any);
  }

  function handleLogout() {
    setMenuOpen(false);
    logout();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.replace("/")}>
        <Image
          source={wordmark}
          style={styles.wordmark}
          resizeMode="contain"
          accessibilityRole="header"
          accessibilityLabel="LoadUp"
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMenuOpen(true)}>
        <Ionicons name="menu" size={28} color={Colors.ink} />
      </TouchableOpacity>

      <Modal visible={menuOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateAndClose("/")}
            >
              <Text style={styles.menuItemText}>Mes programmes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateAndClose("/nutrition")}
            >
              <Text style={styles.menuItemText}>Nutrition</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateAndClose("/account")}
            >
              <Text style={styles.menuItemText}>Mon compte</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuItemText, styles.logoutText]}>
                Se déconnecter
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordmark: {
    width: 90,
    height: 28,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menu: {
    position: "absolute",
    top: 95,
    right: 20,
    backgroundColor: Colors.surface,
    borderRadius: Radius,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 6,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.ink,
  },
  logoutText: {
    color: Colors.accent,
  },
});