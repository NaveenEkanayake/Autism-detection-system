export const API = "http://localhost:8000/api";

export async function getToken() {
  return localStorage.getItem("token") || "";
}

export async function api(path, options = {}) {
  const token = localStorage.getItem("token") || "";
  const headers = {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }
  
  // Map frontend /patients requests to backend /children endpoints
  let cleanPath = path.replace(/^\/|\/$/g, "");
  if (cleanPath.startsWith("patients")) {
    cleanPath = cleanPath.replace("patients", "children");
  }
  
  const url = `${API}/${cleanPath}`;
  const fetchOptions = {
    method: options.method || "GET",
    headers: {
      ...headers,
      ...options.headers,
    },
  };
  
  if (options.body) {
    fetchOptions.body = options.body;
  }
  
  console.log(`[API Request] ${fetchOptions.method} ${url}`, options.body ? "(with body payload)" : "(no body)");

  try {
    const resp = await fetch(url, fetchOptions);
    if (!resp.ok) {
      const text = await resp.text();
      let errMsg = "API Request failed";
      try {
        const errData = JSON.parse(text);
        errMsg = errData.detail || errData.message || errMsg;
      } catch (_) {
        errMsg = text || errMsg;
      }
      console.error(`[API Failure] ${fetchOptions.method} ${url} -> Status ${resp.status}: ${errMsg}`);
      
      if (resp.status === 401 && localStorage.getItem("token")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("activePatient");
        localStorage.removeItem("patients");
        window.location.reload();
      }
      
      throw new Error(errMsg);
    }
    
    const text = await resp.text();
    const data = text ? JSON.parse(text) : {};
    console.log(`[API Success] ${fetchOptions.method} ${url} -> Status ${resp.status}`, data);
    return data;
  } catch (err) {
    if (!(err instanceof Error && err.message.includes("Status"))) {
      console.error(`[API Network Error] ${fetchOptions.method} ${url}:`, err.message || err);
    }
    throw err;
  }
}
