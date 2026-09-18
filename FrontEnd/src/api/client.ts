import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useAuthStore } from "@/store/authStore";

function getApiBaseUrl() {
  // Baked in at build time for production (Vercel sets EXPO_PUBLIC_API_URL).
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  if (Platform.OS === "web") return "http://localhost:3000";
  // On a physical device via Expo Go, "localhost" refers to the device itself.
  // Reuse the Metro dev server's LAN host (same machine running the backend).
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ? `http://${host}:3000` : "http://localhost:3000";
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;