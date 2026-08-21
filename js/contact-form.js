import { adminStore } from "./data/admin-store.js";

const canonicalServiceKeys = new Set([
  "individual-tax",
  "individual-insurance",
  "individual-notary",
  "business-formation",
  "business-operations",
  "business-tax",
  "business-advisory",
  "business-insurance",
  "business-notary",
]);

const legacyServiceAliases = {
  "individual-tax-preparation": "individual-tax",
  "individual-notary-documents": "individual-notary",
  "notary-document-services": "individual-notary",
  "business-administration-operations": "business-operations",
  "business-notary-administrative-services": "business-notary",
  "insurance-review": "individual-insurance",
  "business-digital": "business-operations",
  "business-readiness": "business-formation",
  "business-financial": "business-tax",
};

const serviceAudience = (serviceKey) =>
  serviceKey?.startsWith("business-") ? "business" : "individual";

function normalizeServiceKey(value) {
  const normalized = legacyServiceAliases[value] ?? value;
  return canonicalServiceKeys.has(normalized) ? normalized : "";
}

function clearFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach((error) => error.remove());
  form.querySelectorAll("[aria-invalid='true']").forEach((field) => {
    field.removeAttribute("aria-invalid");
    const describedBy = (field.getAttribute("aria-describedby") ?? "")
      .split(" ")
      .filter((id) => id && !id.endsWith("-error"));
    if (describedBy.length)
      field.setAttribute("aria-describedby", describedBy.join(" "));
    else field.removeAttribute("aria-describedby");
  });
}

function showFieldErrors(form, errors = {}) {
  const fieldMap = {
    full_name: "first-name",
    email: "email",
    phone: "phone",
    audience: "audience",
    service_key: "service",
    message: "message",
    preferred_contact: "contactMethod",
  };

  let firstInvalid = null;
  Object.entries(errors).forEach(([name, message]) => {
    const fieldName = fieldMap[name] ?? name;
    const field =
      form.elements.namedItem(fieldName) ?? document.getElementById(fieldName);
    const target = field instanceof window.RadioNodeList ? field[0] : field;
    if (!(target instanceof window.HTMLElement)) return;

    const errorId = `${target.id || fieldName}-error`;
    const error = document.createElement("span");
    error.className = "field-error";
    error.id = errorId;
    error.textContent = message;
    const container = target.closest(".field") ?? target.parentElement;
    container?.append(error);
    target.setAttribute("aria-invalid", "true");
    target.setAttribute(
      "aria-describedby",
      `${target.getAttribute("aria-describedby") ?? ""} ${errorId}`.trim(),
    );
    firstInvalid ??= target;
  });
  firstInvalid?.focus();
}

function setStatus(status, message, state, moveFocus = true) {
  status.textContent = message;
  status.dataset.state = state;
  if (moveFocus) status.focus({ preventScroll: true });
}

function buildPayload(form) {
  const data = new window.FormData(form);
  const firstName = String(data.get("firstName") ?? "").trim();
  const lastName = String(data.get("lastName") ?? "").trim();
  const serviceKey = String(data.get("service") ?? "").trim();
  const audience = String(data.get("audience") ?? "").trim();

  return {
    firstName,
    lastName,
    full_name: `${firstName} ${lastName}`.trim(),
    email: String(data.get("email") ?? "").trim(),
    phone: String(data.get("phone") ?? "").trim() || null,
    audience,
    service_key: serviceKey || null,
    serviceInterest: serviceKey
      ? (canonicalServiceKeys.has(serviceKey)
        ? serviceKey
        : normalizeServiceKey(serviceKey)) || "General consultation"
      : "General consultation",
    message: String(data.get("message") ?? "").trim(),
    preferred_contact: String(data.get("contactMethod") ?? "").trim() || null,
    preferredContact: String(data.get("contactMethod") ?? "").trim() || null,
    website: String(data.get("website") ?? "").trim(),
  };
}

function initializePreselection(form) {
  const select = form.elements.namedItem("service");
  const audience = form.elements.namedItem("audience");
  const requested = new window.URLSearchParams(window.location.search).get(
    "service",
  );
  const serviceKey = normalizeServiceKey(requested ?? "");
  if (!serviceKey || !(select instanceof window.HTMLSelectElement)) return;
  const requestedOption = requested
    ? [...select.options].some((option) => option.value === requested)
    : false;
  select.value = requestedOption ? requested : serviceKey;
  if (audience instanceof window.HTMLSelectElement)
    audience.value = serviceAudience(serviceKey);
}

export function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!(form instanceof window.HTMLFormElement)) return;

  const status = form.querySelector("#form-status");
  const submit = form.querySelector("button[type='submit']");
  const service = form.elements.namedItem("service");
  const audience = form.elements.namedItem("audience");
  if (
    !(status instanceof window.HTMLElement) ||
    !(submit instanceof window.HTMLButtonElement)
  )
    return;

  initializePreselection(form);
  service?.addEventListener("change", () => {
    const key = normalizeServiceKey(service.value);
    if (key && audience instanceof window.HTMLSelectElement)
      audience.value = serviceAudience(key);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    clearFieldErrors(form);

    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    const originalLabel = submit.textContent;
    submit.textContent = "Submitting…";
    setStatus(status, "Submitting your request securely…", "submitting");

    let validationFailure = false;
    try {
      const response = await fetch("/api/v1/leads/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(buildPayload(form)),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 422) {
          validationFailure = true;
          showFieldErrors(form, result?.error?.fields);
        }
        throw new Error(
          result?.error?.message || "Your request could not be submitted.",
        );
      }

      const reference = result?.data?.leadId;
      const leadPayload = buildPayload(form);
      const localLead = adminStore?.createLeadFromContact
        ? adminStore.createLeadFromContact({
            id: reference || undefined,
            name: leadPayload.full_name || `${leadPayload.firstName} ${leadPayload.lastName}`.trim() || "New lead",
            firstName: leadPayload.firstName,
            lastName: leadPayload.lastName,
            email: leadPayload.email,
            phone: leadPayload.phone,
            audience: leadPayload.audience === "business" ? "Business" : "Individual",
            serviceInterest: leadPayload.serviceInterest,
            message: leadPayload.message,
            preferredContact: leadPayload.preferredContact,
            source: "Website Contact Form",
            receivedAt: new Date().toISOString(),
            status: "New",
            leadSource: "Website Contact Form",
            internalNotes: "Website inquiry created from contact form.",
          })
        : null;

      if (localLead) {
        const event = new window.CustomEvent("alchemize:lead-created", {
          detail: { leadId: localLead.id },
        });
        window.dispatchEvent(event);
      }

      form.reset();
      setStatus(
        status,
        `Your request has been received. Alchemize will review the information and follow up using the contact information provided.${reference ? ` Reference: ${reference}` : ""}`,
        "success",
      );
    } catch (error) {
      setStatus(
        status,
        error instanceof Error
          ? error.message
          : "We couldn't submit your request. Please try again.",
        "error",
        !validationFailure,
      );
    } finally {
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
      submit.textContent = originalLabel;
    }
  });
}

export { canonicalServiceKeys, normalizeServiceKey };
