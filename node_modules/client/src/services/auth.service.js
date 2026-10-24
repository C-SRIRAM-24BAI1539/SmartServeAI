
import api from "./api.js";

export async function registerAccount(data) {
  const response = await api.post("/auth/register", data);

  if (response.data.token) {
    localStorage.setItem("smartserve_token", response.data.token);
  }

  return response.data;
}

export async function loginAccount(data) {
  const response = await api.post("/auth/login", data);

  if (response.data.token) {
    localStorage.setItem("smartserve_token", response.data.token);
  }

  return response.data;
}

export async function getCurrentAccount() {
  const response = await api.get("/auth/me");
  return response.data.user;
}

export function logoutAccount() {
  localStorage.removeItem("smartserve_token");
}