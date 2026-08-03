import api from "./client";

export async function register(email: string, password: string, name: string) {
  const response = await api.post("/auth/register", { email, password, name });
  return response.data;
}

export async function login(email: string, password: string) {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
}

export async function deleteAccount() {
  const response = await api.delete("/auth/account");
  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await api.post("/auth/reset-password", { token, newPassword });
  return response.data;
}