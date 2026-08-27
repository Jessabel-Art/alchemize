import { buildApiUrl } from "./admin-api.js";

async function getPortalResource(resource) {
  return portalRequest(resource);
}

async function portalRequest(resource, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (options.body && !(options.body instanceof window.FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const csrfToken = window.__ALCHEMIZE_CSRF_TOKEN__ || "";
  if (!["GET", "HEAD"].includes(method) && csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }
  const response = await fetch(buildApiUrl(`portal/${resource}`), {
    ...options,
    method,
    credentials: "same-origin",
    headers,
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || "The client portal could not be loaded.",
    );
    error.status = response.status;
    error.code = payload?.error?.code || "PORTAL_REQUEST_FAILED";
    error.fields = payload?.error?.fields || {};
    if (import.meta.env.DEV) {
      console.error("Client Portal API request failed", {
        resource,
        method,
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }
    throw error;
  }

  return payload?.data ?? {};
}

export const portalApi = {
  dashboard: () => getPortalResource("dashboard"),
  services: () => getPortalResource("services"),
  requestService: (payload) =>
    portalRequest("services/request", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  tasks: () => getPortalResource("tasks"),
  documents: () => getPortalResource("documents"),
  documentDownloadUrl: (id) => buildApiUrl(`portal/documents/${id}/download`),
  appointments: () => getPortalResource("appointments"),
  messages: () => getPortalResource("messages"),
  intakes: () => getPortalResource("intakes"),
  intake: (id) => getPortalResource(`intakes/${id}`),
  saveIntake: (id, responses) =>
    portalRequest(`intakes/${id}`, {
      method: "PUT",
      body: JSON.stringify({ responses }),
    }),
  submitIntake: (id) =>
    portalRequest(`intakes/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  saveProfileAddress: (id, payload) =>
    portalRequest(`intakes/profile/addresses${id ? `/${id}` : ""}`, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    }),
  removeProfileAddress: (id) =>
    portalRequest(`intakes/profile/addresses/${id}/remove`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  saveProfilePerson: (id, payload) =>
    portalRequest(`intakes/profile/people${id ? `/${id}` : ""}`, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    }),
  removeProfilePerson: (id) =>
    portalRequest(`intakes/profile/people/${id}/remove`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  prepareRequirementUpload: (assignmentId, requirementId) =>
    portalRequest(
      `intakes/${assignmentId}/requirements/${requirementId}/upload-handoff`,
      { method: "POST", body: JSON.stringify({}) },
    ),
  useExistingForRequirement: (assignmentId, requirementId, documentId) =>
    portalRequest(
      `intakes/${assignmentId}/requirements/${requirementId}/use-existing`,
      { method: "POST", body: JSON.stringify({ document_id: documentId }) },
    ),
  billing: () => getPortalResource("billing"),
  checkoutInvoice: (id) =>
    portalRequest(`billing/${id}/checkout`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  profile: () => getPortalResource("profile"),
  activity: () => getPortalResource("activity"),
  completeTask: (id, response = "") =>
    portalRequest(`tasks/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({ response }),
    }),
  acknowledgeTask: (id) =>
    portalRequest(`tasks/${id}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  respondToTask: (id, response) =>
    portalRequest(`tasks/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ response }),
    }),
  uploadDocument: (id, file, comment = "") => {
    const body = new window.FormData();
    body.append("document", file);
    if (comment) body.append("comment", comment);
    return portalRequest(`documents/${id}/upload`, { method: "POST", body });
  },
  uploadGeneralDocument: (file, payload = {}) => {
    const body = new window.FormData();
    body.append("document", file);
    Object.entries(payload).forEach(([key, value]) => {
      if (value) body.append(key, value);
    });
    return portalRequest("documents/upload", { method: "POST", body });
  },
  thread: (id) => getPortalResource(`messages/${id}`),
  createThread: (payload) =>
    portalRequest("messages", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  reply: (id, message) =>
    portalRequest(`messages/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  markThreadRead: (id) =>
    portalRequest(`messages/${id}/read`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  archiveThread: (id) =>
    portalRequest(`messages/${id}/archive`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  appointmentAction: (id, action, payload = {}) =>
    portalRequest(`appointments/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  requestAppointment: (payload) =>
    portalRequest("appointments/request", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProfile: (payload) =>
    portalRequest("profile", { method: "PUT", body: JSON.stringify(payload) }),
  dismissOnboarding: () =>
    portalRequest("onboarding/dismiss", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  requestAuthorizedUser: (payload) =>
    portalRequest("authorized-users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  acknowledge: (type, id) =>
    portalRequest(`acknowledgements/${type}/${id}`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
};

export default portalApi;
