import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";

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
        <Text style={styles.title} role="heading" aria-level={1}>
          LoadUp
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMenuOpen(true)}>
        <Ionicons name="menu" size={28} color="#fff" />
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
    backgroundColor: "#000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  menu: {
    position: "absolute",
    top: 95,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 6,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  logoutText: {
    color: "#cc0000",
  },
});