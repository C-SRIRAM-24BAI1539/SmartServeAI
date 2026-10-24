const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function api(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${API_URL}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, ...(body && { body: JSON.stringify(body) }) });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
