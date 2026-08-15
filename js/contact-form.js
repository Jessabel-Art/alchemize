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
  return {
    full_name:
      `${data.get("firstName") ?? ""} ${data.get("lastName") ?? ""}`.trim(),
    email: data.get("email"),
    phone: data.get("phone") || null,
    audience: data.get("audience"),
    service_key: data.get("service") || null,
    message: data.get("message"),
    preferred_contact: data.get("contactMethod") || null,
    website: data.get("website") || "",
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
  select.value = serviceKey;
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
