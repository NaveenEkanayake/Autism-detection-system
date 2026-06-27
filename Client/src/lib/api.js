const API = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

export async function getToken() {
  const { auth } = await import("../lib/firebase");
  const idToken = await auth.currentUser?.getIdToken();
  return idToken;
}

export async function api(path, options = {}) {
  const token = await getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  return res.json();
}
