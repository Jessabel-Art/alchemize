import { contactServiceGroups } from "../src/pages/services/serviceCatalog.js";

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
    if (field.validity.valueMissing) {
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

export function initContactForm(messages = {}) {
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
  const handleServiceChange = () => {
    const key = normalizeServiceKey(service.value);
    if (key && audience instanceof window.HTMLSelectElement)
      audience.value = serviceAudience(key);
  };
  service?.addEventListener("change", handleServiceChange);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    clearFieldErrors(form);

    applyLocalizedValidity(form, messages);
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    const originalLabel = submit.textContent;
    submit.textContent = messages.submitting ?? "Submitting…";
    setStatus(
      status,
      messages.submittingStatus ?? "Submitting your request securely…",
      "submitting",
    );

    let validationFailure = false;
    try {
      const response = await fetch("/alchemize-api.php?route=leads", {
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
          showFieldErrors(form, result?.error?.fields, messages);
        }
        const publicMessage =
          response.status === 422
            ? messages.validation || result?.error?.message
            : response.status === 429
              ? messages.rateLimited || result?.error?.message
              : messages.temporary || messages.failure;
        throw new Error(
          publicMessage || "Your request could not be submitted.",
        );
      }

      form.reset();
      setStatus(
        status,
        messages.success ??
          "Thank you for contacting Alchemize. We will follow up shortly.",
        "success",
      );
    } catch (error) {
      setStatus(
        status,
        error instanceof Error
          ? error.message
          : (messages.fallback ??
              "We couldn't submit your request. Please try again."),
        "error",
        !validationFailure,
      );
    } finally {
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
      submit.textContent = originalLabel;
    }
  };
  form.addEventListener("submit", handleSubmit);
  return () => {
    service?.removeEventListener("change", handleServiceChange);
    form.removeEventListener("submit", handleSubmit);
  };
}

export { canonicalServiceKeys, contactServiceGroups, normalizeServiceKey };
