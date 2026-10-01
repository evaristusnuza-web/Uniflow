const configuredBase = window.UNIFLOW_API_BASE || "";
export const API_BASE = (configuredBase || "/api").replace(/\/+$/, "");
const TOKEN_KEY = "uniflow_token";

export function setToken(token, remember = true) {
  clearToken();
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

export function logout() {
  clearToken();
}

export function assetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function downloadFile(path, fileName) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(assetUrl(path), { headers });
  } catch {
    throw new Error("Could not reach UniFlow. Check the API connection and try again.");
  }

  if (!response.ok) {
    const text = await response.text();
    let payload = {};
    try { payload = text ? JSON.parse(text) : {}; } catch { payload = { message: text }; }
    if (response.status === 401) clearToken();
    const message = payload.message || payload.error || `Download failed (${response.status})`;
    throw new Error(Array.isArray(message) ? message.join("; ") : String(message));
  }

  const url = window.URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  const unsafeCharacters = new Set(["\\", "/", ":", "*", "?", '"', "<", ">", "|"]);
  link.download = [...(fileName || "study-paper.pdf")]
    .map((character) =>
      unsafeCharacters.has(character) || character.charCodeAt(0) < 32
        ? "_"
        : character,
    )
    .join("");
  link.href = url;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

export async function api(path, { method = "GET", body, headers = {} } = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const finalHeaders = { ...headers };
  const token = getToken();
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData && body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${normalizedPath}`, {
      method: method.toUpperCase(),
      headers: finalHeaders,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Could not reach UniFlow. Check the API connection and try again.");
    }
    throw error;
  }

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    if (response.status === 401 && !normalizedPath.startsWith("/auth/")) clearToken();
    const message = data.message || data.error || data.raw || `Request failed (${response.status})`;
    throw new Error(Array.isArray(message) ? message.join("; ") : String(message));
  }
  return data;
}

export async function login({ email, password, remember = true }) {
  const { token, user } = await api("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!token || !user) throw new Error("The API returned an incomplete sign-in response.");
  setToken(token, remember);
  return { token, user };
}

export async function register({ email, username, password, major, remember = true }) {
  const payload = { email, username, password };
  if (major?.trim()) payload.major = major.trim();
  const { token, user } = await api("/auth/register", {
    method: "POST",
    body: payload,
  });
  if (!token || !user) throw new Error("The API returned an incomplete registration response.");
  setToken(token, remember);
  return { token, user };
}

export function me() {
  return api("/me");
}

export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export function initials(name) {
  const parts = String(name || "Student").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0].toLocaleUpperCase()).join("") || "S";
}
