const clone = (value) => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

async function apiRequest(url, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const csrfToken = window.__ALCHEMIZE_CSRF_TOKEN__ || "";
  if (method !== "GET" && method !== "HEAD" && csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.error?.message || "Request failed.";
    throw new Error(message);
  }

  return payload?.data ?? payload ?? null;
}

export const auth = {
  async session() {
    const data = await apiRequest("/api/v1/auth/session");
    if (data?.csrf_token) {
      window.__ALCHEMIZE_CSRF_TOKEN__ = data.csrf_token;
    }
    return data || { authenticated: false, user: null, csrf_token: "" };
  },

  async login(credentials) {
    const data = await apiRequest("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (data?.csrf_token) {
      window.__ALCHEMIZE_CSRF_TOKEN__ = data.csrf_token;
    }
    return data;
  },

  async logout() {
    const data = await apiRequest("/api/v1/auth/logout", { method: "POST" });
    delete window.__ALCHEMIZE_CSRF_TOKEN__;
    return data;
  },
};

export const clients = {
  list: () => apiRequest("/api/v1/clients"),
  get: (id) => apiRequest(`/api/v1/clients/${id}`),
  create: (payload) => apiRequest("/api/v1/clients", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/api/v1/clients/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
};

export const services = {
  list: () => apiRequest("/api/v1/services"),
  get: (id) => apiRequest(`/api/v1/services/${id}`),
  create: (payload) => apiRequest("/api/v1/services", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/api/v1/services/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
};

export const engagements = {
  list: () => apiRequest("/api/v1/engagements"),
  get: (id) => apiRequest(`/api/v1/engagements/${id}`),
  create: (payload) => apiRequest("/api/v1/engagements", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/api/v1/engagements/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
};

export const tasks = {
  list: () => apiRequest("/api/v1/tasks"),
  get: (id) => apiRequest(`/api/v1/tasks/${id}`),
  create: (payload) => apiRequest("/api/v1/tasks", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/api/v1/tasks/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
};

export const appointments = {
  list: () => apiRequest("/api/v1/appointments"),
  get: (id) => apiRequest(`/api/v1/appointments/${id}`),
  create: (payload) => apiRequest("/api/v1/appointments", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/api/v1/appointments/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
};

export const documents = {
  list: () => apiRequest("/api/v1/documents"),
  get: (id) => apiRequest(`/api/v1/documents/${id}`),
  create: (payload) => apiRequest("/api/v1/documents", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/api/v1/documents/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
};

export const invoices = {
  list: () => apiRequest("/api/v1/invoices"),
  get: (id) => apiRequest(`/api/v1/invoices/${id}`),
  create: (payload) => apiRequest("/api/v1/invoices", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/api/v1/invoices/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
};

export const payments = {
  create: (payload) => apiRequest("/api/v1/payments", { method: "POST", body: JSON.stringify(payload) }),
};

export const leads = {
  list: () => apiRequest("/api/v1/leads"),
  get: (id) => apiRequest(`/api/v1/leads/${id}`),
  update: (id, payload) => apiRequest(`/api/v1/leads/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  convert: (id, payload) => apiRequest(`/api/v1/leads/${id}/convert`, { method: "POST", body: JSON.stringify(payload) }),
};

export async function getLeads() {
  return leads.list();
}

export async function getLeadById(id) {
  return leads.get(id);
}

export async function getAdminSession() {
  return auth.session();
}

export function getAdminSnapshot() {
  return clone({});
}

export default {
  auth,
  clients,
  services,
  engagements,
  tasks,
  appointments,
  documents,
  invoices,
  payments,
  leads,
};
