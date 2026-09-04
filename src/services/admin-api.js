const clone = (value) =>
  value === undefined ? value : JSON.parse(JSON.stringify(value));

export function buildApiUrl(route, params = {}) {
  const safeRoute = String(route ?? "").trim();
  if (!safeRoute || !/^[A-Za-z0-9][A-Za-z0-9_/-]*$/.test(safeRoute)) {
    throw new Error("Invalid API route.");
  }

  const query = new window.URLSearchParams(params);
  query.set("route", safeRoute);
  return `/alchemize-api.php?${query.toString()}`;
}

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
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = payload?.error?.message || "Request failed.";
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.error?.code || "API_REQUEST_FAILED";
    error.fields = payload?.error?.fields || {};
    if (import.meta.env.DEV) {
      console.error("Alchemize API request failed", {
        url,
        method,
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }
    throw error;
  }

  return payload?.data ?? payload ?? null;
}

export const auth = {
  async session() {
    const data = await apiRequest(buildApiUrl("auth/session"));
    if (data?.csrf_token) {
      window.__ALCHEMIZE_CSRF_TOKEN__ = data.csrf_token;
    }
    return data || { authenticated: false, user: null, csrf_token: "" };
  },

  async login(credentials) {
    const data = await apiRequest(buildApiUrl("auth/login"), {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (data?.csrf_token) {
      window.__ALCHEMIZE_CSRF_TOKEN__ = data.csrf_token;
    }
    return data;
  },

  async logout() {
    const data = await apiRequest(buildApiUrl("auth/logout"), {
      method: "POST",
    });
    delete window.__ALCHEMIZE_CSRF_TOKEN__;
    return data;
  },
  requestAccess: (payload) =>
    apiRequest(buildApiUrl("leads"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  setPassword: (payload) =>
    apiRequest(buildApiUrl("auth/set-password"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  forgotPassword: (email) =>
    apiRequest(buildApiUrl("auth/forgot-password"), {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  changePassword: (payload) =>
    apiRequest(buildApiUrl("auth/change-password"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const clients = {
  list: () => apiRequest(buildApiUrl("clients")),
  get: (id) => apiRequest(buildApiUrl(`clients/${id}`)),
  create: (payload) =>
    apiRequest(buildApiUrl("clients"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(buildApiUrl(`clients/${id}`), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  portalAccount: (id) =>
    apiRequest(buildApiUrl(`clients/${id}/portal-account`)),
  sendInvitation: (id) =>
    apiRequest(buildApiUrl(`clients/${id}/portal-invitation`), {
      method: "POST",
    }),
  sendPasswordReset: (id) =>
    apiRequest(buildApiUrl(`clients/${id}/password-reset`), { method: "POST" }),
  createPortalAccess: (id) =>
    apiRequest(buildApiUrl(`clients/${id}/portal-access`), { method: "POST" }),
  copySetupLink: (id) =>
    apiRequest(buildApiUrl(`clients/${id}/setup-link`), { method: "POST" }),
  copyPasswordResetLink: (id) =>
    apiRequest(buildApiUrl(`clients/${id}/password-reset-link`), {
      method: "POST",
    }),
  disablePortal: (id) =>
    apiRequest(buildApiUrl(`clients/${id}/disable-portal`), { method: "POST" }),
  enablePortal: (id) =>
    apiRequest(buildApiUrl(`clients/${id}/enable-portal`), { method: "POST" }),
  team: () => apiRequest(buildApiUrl("clients/team")),
  assignService: (id, payload) =>
    apiRequest(buildApiUrl(`clients/${id}/services`), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const services = {
  list: () => apiRequest(buildApiUrl("services")),
  get: (id) => apiRequest(buildApiUrl(`services/${id}`)),
  create: (payload) =>
    apiRequest(buildApiUrl("services"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(buildApiUrl(`services/${id}`), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  calculate: (id, payload) =>
    apiRequest(buildApiUrl(`services/${id}/calculate`), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const settings = {
  get: () => apiRequest(buildApiUrl("settings")),
  update: (payload) =>
    apiRequest(buildApiUrl("settings"), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const engagements = {
  list: () => apiRequest(buildApiUrl("engagements")),
  get: (id) => apiRequest(buildApiUrl(`engagements/${id}`)),
  create: (payload) =>
    apiRequest(buildApiUrl("engagements"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(buildApiUrl(`engagements/${id}`), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  documentTypes: (id) =>
    apiRequest(buildApiUrl(`engagements/${id}/document-types`)),
};

export const tasks = {
  list: () => apiRequest(buildApiUrl("tasks")),
  get: (id) => apiRequest(buildApiUrl(`tasks/${id}`)),
  create: (payload) =>
    apiRequest(buildApiUrl("tasks"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(buildApiUrl(`tasks/${id}`), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const appointments = {
  list: () => apiRequest(buildApiUrl("appointments")),
  get: (id) => apiRequest(buildApiUrl(`appointments/${id}`)),
  create: (payload) =>
    apiRequest(buildApiUrl("appointments"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(buildApiUrl(`appointments/${id}`), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  listAvailability: () => apiRequest(buildApiUrl("appointments/availability")),
  createAvailability: (payload) =>
    apiRequest(buildApiUrl("appointments/availability"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAvailability: (id, payload) =>
    apiRequest(buildApiUrl(`appointments/availability/${id}`), {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteAvailability: (id) =>
    apiRequest(buildApiUrl(`appointments/availability/${id}`), {
      method: "DELETE",
    }),
  createSchedulingLink: (payload) =>
    apiRequest(buildApiUrl("appointments/scheduling-links"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const documents = {
  list: () => apiRequest(buildApiUrl("documents")),
  get: (id) => apiRequest(buildApiUrl(`documents/${id}`)),
  create: (payload) =>
    apiRequest(buildApiUrl("documents"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(buildApiUrl(`documents/${id}`), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const invoices = {
  list: () => apiRequest(buildApiUrl("invoices")),
  get: (id) => apiRequest(buildApiUrl(`invoices/${id}`)),
  create: (payload) =>
    apiRequest(buildApiUrl("invoices"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(buildApiUrl(`invoices/${id}`), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const payments = {
  list: () => apiRequest(buildApiUrl("payments")),
  create: (payload) =>
    apiRequest(buildApiUrl("payments"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const portalAdmin = {
  attention: () => apiRequest(buildApiUrl("portal-admin/attention")),
  accessGrants: (clientId) =>
    apiRequest(
      buildApiUrl(
        "portal-admin/access",
        clientId ? { client_id: clientId } : {},
      ),
    ),
  updateAccessGrant: (id, payload) =>
    apiRequest(buildApiUrl(`portal-admin/access/${id}`), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  documentDownloadUrl: (id) =>
    buildApiUrl(`portal-admin/documents/${id}/download`),
  documentVersions: (id) =>
    apiRequest(buildApiUrl(`portal-admin/documents/${id}/versions`)),
  resolve: (type, id, decision, payload = {}) =>
    apiRequest(buildApiUrl(`portal-admin/resolve/${type}/${id}/${decision}`), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  reply: (id, message) =>
    apiRequest(buildApiUrl(`portal-admin/messages/${id}/reply`), {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  messages: () => apiRequest(buildApiUrl("portal-admin/messages")),
  createMessage: (payload) =>
    apiRequest(buildApiUrl("portal-admin/messages"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  message: (id) => apiRequest(buildApiUrl(`portal-admin/messages/${id}`)),
  updateMessage: (id, status) =>
    apiRequest(buildApiUrl(`portal-admin/messages/${id}`), {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  linkMessage: (id, payload) =>
    apiRequest(buildApiUrl(`portal-admin/messages/${id}/link`), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const intakeAdmin = {
  list: () => apiRequest(buildApiUrl("portal-admin/intakes")),
  get: (id) => apiRequest(buildApiUrl(`portal-admin/intakes/${id}`)),
  assign: (payload) =>
    apiRequest(buildApiUrl("portal-admin/intakes"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  review: (id, payload) =>
    apiRequest(buildApiUrl(`portal-admin/intakes/${id}`), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  reviewRequirement: (assignmentId, requirementId, decision, payload = {}) =>
    apiRequest(
      buildApiUrl(
        `portal-admin/intakes/${assignmentId}/requirements/${requirementId}/${decision}`,
      ),
      { method: "POST", body: JSON.stringify(payload) },
    ),
};

export const leads = {
  list: () => apiRequest(buildApiUrl("leads")),
  get: (id) => apiRequest(buildApiUrl(`leads/${id}`)),
  create: (payload) =>
    apiRequest(buildApiUrl("leads"), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(buildApiUrl(`leads/${id}`), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  convert: (id, payload) =>
    apiRequest(buildApiUrl(`leads/${id}/convert`), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  addNote: (id, payload) =>
    apiRequest(buildApiUrl(`leads/${id}/notes`), {
      method: "POST",
      body: JSON.stringify(payload),
    }),
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
  settings,
  engagements,
  tasks,
  appointments,
  documents,
  invoices,
  payments,
  portalAdmin,
  leads,
};
