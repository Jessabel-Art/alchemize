import { getContactServiceGroups } from "../src/pages/services/publicServiceIndex.js";
import {
  trackContactFormError,
  trackContactFormStart,
  trackContactFormSubmit,
} from "../src/services/leadAnalytics.js";

// English groups: only the canonical keys and audiences are used from here.
const contactServiceGroups = getContactServiceGroups("en");

const canonicalServiceKeys = new Set(
  contactServiceGroups.flatMap((group) =>
    group.items.map((service) => service.value),
  ),
);

const legacyServiceAliases = {
  "individual-tax-preparation": "individual-tax",
  "individual-notary-documents": "individual-notary",
  "notary-document-services": "individual-notary",
  "business-administration-operations": "business-operations",
  "business-notary-administrative-services": "business-notary",
  "insurance-review": "individual-insurance",
  "business-formation": "business-readiness",
  "business-tax": "business-financial",
  "web-digital": "business-digital",
  "digital-business-technology": "business-digital",
};

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

function showFieldErrors(form, errors = {}, messages = {}) {
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
    error.textContent = messages.fieldErrors?.[name] ?? message;
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

function applyLocalizedValidity(form, messages) {
  for (const field of form.elements) {
    if (!(
      field instanceof window.HTMLInputElement ||
      field instanceof window.HTMLSelectElement ||
      field instanceof window.HTMLTextAreaElement
    ))
      continue;
    field.setCustomValidity("");
    const method = form.elements.namedItem("contactMethod")?.value;
    if (field.name === "phone" && method === "phone" && !field.value.trim()) {
      field.setCustomValidity(
        messages.phoneRequired ??
          "Enter a phone number, or choose another contact method.",
      );
    } else if (field.validity.valueMissing) {
      field.setCustomValidity(
        messages.required ?? "Please complete this required field.",
      );
    } else if (field.validity.typeMismatch) {
      field.setCustomValidity(messages.email ?? "Please enter a valid value.");
    } else if (field.validity.tooShort) {
      field.setCustomValidity(
        messages.messageLength ?? "Please provide more detail.",
      );
    }
  }
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
    language_preference:
      String(data.get("languagePreference") ?? "en").trim() || "en",
    website: String(data.get("website") ?? "").trim(),
  };
}

// What analytics may know about the form: fixed identifiers only. The service is
// re-normalised to a canonical key so a translated label can never leak through.
function analyticsSnapshot(form) {
  const data = new window.FormData(form);
  return {
    serviceKey: normalizeServiceKey(String(data.get("service") ?? "")),
    audience: String(data.get("audience") ?? ""),
    language:
      String(data.get("languagePreference") ?? "en") === "es" ? "es" : "en",
  };
}

export function initContactForm(messages = {}, hooks = {}) {
  const form = document.querySelector("[data-contact-form]");
  if (!(form instanceof window.HTMLFormElement)) return;

  const status = form.querySelector("#form-status");
  const submit = form.querySelector("button[type='submit']");
  if (
    !(status instanceof window.HTMLElement) ||
    !(submit instanceof window.HTMLButtonElement)
  )
    return;

  // contact_form_start: once per form interaction, on the first real edit or
  // selection. Focusing or tabbing through does not count, and neither does the
  // hidden honeypot field.
  let started = false;
  const handleFirstInteraction = (event) => {
    const target = event.target;
    if (started || !(target instanceof window.HTMLElement)) return;
    if (!target.matches("input, select, textarea")) return;
    if (target.closest(".contact-honeypot")) return;
    started = true;
    trackContactFormStart({
      ...analyticsSnapshot(form),
      origin: hooks.getOrigin?.(),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    clearFieldErrors(form);

    applyLocalizedValidity(form, messages);
    if (!form.reportValidity()) {
      trackContactFormError({
        errorType: "validation",
        errorField: form.querySelector(":invalid")?.getAttribute("name") ?? "",
        ...analyticsSnapshot(form),
      });
      return;
    }
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    const originalLabel = submit.textContent;
    submit.textContent = messages.submitting ?? "Submitting…";
    setStatus(
      status,
      messages.submittingStatus ?? "Submitting your request securely…",
      "submitting",
    );

    const payload = buildPayload(form);
    const snapshot = analyticsSnapshot(form);
    const fallbackMessage =
      messages.temporary ||
      messages.failure ||
      messages.fallback ||
      "We couldn't submit your request. Please try again.";
    // { type, message, moveFocus, field } describing why nothing was stored
    let failure = null;
    let confirmed = null;

    try {
      const response = await fetch("/alchemize-api.php?route=leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 422) {
          showFieldErrors(form, result?.error?.fields, messages);
          failure = {
            type: "server_validation",
            field: Object.keys(result?.error?.fields ?? {})[0] ?? "",
            message:
              messages.validation || result?.error?.message || fallbackMessage,
            moveFocus: false,
          };
        } else if (response.status === 429) {
          failure = {
            type: "rate_limited",
            message:
              messages.rateLimited || result?.error?.message || fallbackMessage,
          };
        } else {
          failure = {
            type: response.status >= 500 ? "server_error" : "request_rejected",
            message: fallbackMessage,
          };
        }
      } else if (
        typeof result?.data?.leadId !== "string" ||
        result.data.leadId === ""
      ) {
        // 2xx but no stored-lead confirmation (e.g. a proxy/SPA fallback page)
        failure = { type: "invalid_response", message: fallbackMessage };
      } else {
        confirmed = result.data;
      }
    } catch {
      // fetch itself failed (offline, DNS, blocked): never surface the
      // browser's untranslated technical message
      failure = { type: "network_error", message: fallbackMessage };
    }

    try {
      if (confirmed) {
        form.reset();
        started = false;
        // Analytics only counts a lead the backend stored. The honeypot and
        // duplicate paths also answer 2xx but do not create a new lead.
        if (!payload.website && confirmed.duplicate !== true) {
          trackContactFormSubmit({ ...snapshot, origin: hooks.getOrigin?.() });
        }
        setStatus(
          status,
          messages.success ??
            "Thank you for contacting Alchemize. We will follow up shortly.",
          "success",
          !hooks.onSuccess,
        );
        hooks.onSuccess?.();
      } else {
        trackContactFormError({
          errorType: failure.type,
          errorField: failure.field,
          ...snapshot,
        });
        setStatus(
          status,
          failure.message,
          "error",
          failure.moveFocus !== false,
        );
      }
    } finally {
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
      submit.textContent = originalLabel;
    }
  };
  form.addEventListener("input", handleFirstInteraction);
  form.addEventListener("change", handleFirstInteraction);
  form.addEventListener("submit", handleSubmit);
  return () => {
    form.removeEventListener("input", handleFirstInteraction);
    form.removeEventListener("change", handleFirstInteraction);
    form.removeEventListener("submit", handleSubmit);
  };
}

export { canonicalServiceKeys, contactServiceGroups, normalizeServiceKey };
