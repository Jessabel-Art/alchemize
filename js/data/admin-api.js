import { adminStore } from "./admin-store.js";

export * from "../../src/services/admin-api.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

async function fetchJson(url, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  const csrfToken = window.__ALCHEMIZE_CSRF_TOKEN__ || "";
  if (options.method && !["GET", "HEAD"].includes(options.method.toUpperCase())) {
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
    throw new Error(payload?.error?.message || "Request failed.");
  }

  return payload?.data ?? payload ?? null;
}

export { adminStore };

export async function getAdminSession() {
  try {
    const data = await fetchJson("/api/v1/auth/session");
    if (data?.csrf_token) {
      window.__ALCHEMIZE_CSRF_TOKEN__ = data.csrf_token;
    }
    return data;
  } catch {
    return { authenticated: false, user: null, csrf_token: "" };
  }
}

export function resetAdminPrototype() {
  adminStore.reset();
}

export async function getAdminDashboard() {
  return clone(adminStore.getSnapshot());
}

export async function getLeads() {
  try {
    return await fetchJson("/api/v1/leads");
  } catch {
    return clone(adminStore.state.leads);
  }
}

export async function getLeadById(id) {
  try {
    return await fetchJson(`/api/v1/leads/${id}`);
  } catch {
    return clone(adminStore.findLeadById(id));
  }
}

export async function getClients() {
  try {
    return await fetchJson("/api/v1/clients");
  } catch {
    return clone(adminStore.state.clients);
  }
}

export async function getClientById(id) {
  try {
    return await fetchJson(`/api/v1/clients/${id}`);
  } catch {
    return clone(adminStore.findClientById(id));
  }
}

export async function getEngagements() {
  try {
    return await fetchJson("/api/v1/engagements");
  } catch {
    return clone(adminStore.state.engagements);
  }
}

export async function getEngagementById(id) {
  try {
    return await fetchJson(`/api/v1/engagements/${id}`);
  } catch {
    return clone(adminStore.findEngagementById(id));
  }
}

export async function getTasks() {
  try {
    return await fetchJson("/api/v1/tasks");
  } catch {
    return clone(adminStore.state.tasks);
  }
}

export async function getDocuments() {
  try {
    return await fetchJson("/api/v1/documents");
  } catch {
    return clone(adminStore.state.documents);
  }
}

export async function getAppointments() {
  try {
    return await fetchJson("/api/v1/appointments");
  } catch {
    return clone(adminStore.state.appointments);
  }
}

export async function getMessages() {
  return clone(adminStore.state.messages);
}

export async function getInvoices() {
  try {
    return await fetchJson("/api/v1/invoices");
  } catch {
    return clone(adminStore.state.invoices);
  }
}

export async function getActivity() {
  return clone(adminStore.state.activity);
}

export async function getContentInventory() {
  return clone(adminStore.state.contentInventory);
}

export async function getAdminSnapshot() {
  return clone(adminStore.getSnapshot());
}
