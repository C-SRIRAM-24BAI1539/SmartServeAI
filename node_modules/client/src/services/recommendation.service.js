import api from "./api.js";

export async function recommendProviders(data) {
  const response = await api.post("/recommendations", data);
  return response.data;
}
