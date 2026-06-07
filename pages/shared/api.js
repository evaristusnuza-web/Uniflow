export const API_BASE = "https://uniflow-ofv0.onrender.com";
const TOKEN_KEY = "uniflow_token";

// ---------- Token helpers ----------
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ---------- Core API helper ----------
export async function api(path, { method = "GET", body, headers = {} } = {}) {
  method = method.toUpperCase();

  const finalHeaders = { ...headers };
  const token = getToken();
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  const isFormData = body instanceof FormData;
  if (!isFormData && body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined)
  });

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = data.message || data.error || text || `Request failed (${res.status})`;
    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }

  return data;
}

// ---------- Convenience auth calls ----------
export async function login({ email, password }) {
  const { token, user } = await api("/auth/login", {
    method: "POST",
    body: { email, password }
  });
  setToken(token);
  return { token, user };
}

export async function register({ email, username, password, major }) {
  const payload = { email, username, password };
  if (major) payload.major = major;

  const { token, user } = await api("/auth/register", {
    method: "POST",
    body: payload
  });
  setToken(token);
  return { token, user };
}

export async function me() {
  return await api("/me");
}

export function logout() {
  clearToken();
}

// ---------- UI helpers ----------
export function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

export function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0].toUpperCase())
    .join("");
}