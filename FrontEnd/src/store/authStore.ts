import { create } from "zustand";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const storage = {
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async getItem(key: string) {
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  async deleteItem(key: string) {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

type User = {
  id: string;
  email: string;
  name: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,

  setAuth: (user, token) => {
    storage.setItem("token", token);
    storage.setItem("user", JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    storage.deleteItem("token");
    storage.deleteItem("user");
    set({ user: null, token: null });
  },

  hydrate: async () => {
    const token = await storage.getItem("token");
    const userJson = await storage.getItem("user");
    if (token && userJson) {
      set({ token, user: JSON.parse(userJson) });
    }
    set({ isHydrated: true });
  },
}));

export { storage };