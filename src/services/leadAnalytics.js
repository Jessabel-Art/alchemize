// Lead-funnel measurement built on the existing GA4 tag (analytics.js).
//
// Funnel: service_cta_click -> contact_form_start -> contact_form_submit
// (+ contact_form_error, phone_click, email_click).
//
// Every payload here is assembled from fixed identifiers (service keys, taxonomy
// category keys, paths, enumerated locations). Nothing the visitor types (name,
// email, phone, message, business name) is ever passed in, and every helper
// builds its parameters explicitly instead of forwarding an object it was given.
import { categoryByServiceKey } from "../data/serviceTaxonomy.js";
import { contactRouting } from "../data/contactInfo.js";
import { normalizePagePath, trackEvent } from "./analytics.js";

const UNSPECIFIED = "unspecified";
const DIRECT = "direct";
const PARAM_MAX = 100; // GA4 truncates event parameter values at 100 characters
const ROUTE_KEY = "alchemize.leadRoute";
const ROUTE_TTL_MS = 30 * 60 * 1000;

const clip = (value) => String(value ?? "").slice(0, PARAM_MAX);

export const languageFromPath = (pathname = "") =>
  pathname === "/es" || String(pathname).startsWith("/es/") ? "es" : "en";

const currentPath = () =>
  typeof window === "undefined"
    ? "/"
    : normalizePagePath(window.location.pathname);

export const isContactPath = (pathname = "") =>
  /^(\/es)?\/contact$/.test(normalizePagePath(pathname));

// "individuals" | "businesses" (taxonomy / catalog) or "individual" | "business"
// (form) -> the form's value; anything else -> "".
export function audienceValue(audience = "") {
  if (audience === "individuals" || audience === "individual")
    return "individual";
  if (audience === "businesses" || audience === "business") return "business";
  return "";
}

// The stable identity of a service for analytics. `service_key` is the canonical
// lead key (also what the backend stores), never a translated label.
// `service_category` is the taxonomy category key. Digital Support is the
// individual pathway to the same `business-digital` service, so it keeps that
// key and is told apart by `audience` + `service_category: "digital-support"`.
export function describeService(serviceKey, audience = "") {
  const key = String(serviceKey ?? "").trim();
  const category = categoryByServiceKey.get(key);
  if (!category) {
    return {
      service_key: UNSPECIFIED,
      service_category: UNSPECIFIED,
      audience: audienceValue(audience) || UNSPECIFIED,
    };
  }
  let resolvedAudience = audienceValue(audience);
  if (!resolvedAudience) {
    resolvedAudience = audienceValue(category.audience);
  }
  const sharedIndividualPath =
    key === "business-digital" && resolvedAudience === "individual";
  return {
    service_key: key,
    service_category: sharedIndividualPath ? "digital-support" : category.key,
    audience: resolvedAudience,
  };
}

/* ---- where the visitor came from -------------------------------------- */

const readRoute = () => {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(ROUTE_KEY) || "");
    if (
      stored &&
      typeof stored.previous === "string" &&
      Date.now() - stored.at < ROUTE_TTL_MS
    )
      return stored.previous;
  } catch {
    // storage unavailable or empty: fall through
  }
  return "";
};

const writeRoute = (previous) => {
  try {
    window.sessionStorage.setItem(
      ROUTE_KEY,
      JSON.stringify({ previous, at: Date.now() }),
    );
  } catch {
    // measurement must never depend on storage
  }
};

let routeCurrent = "";

// Called on every route change. Remembers the last page that was not Contact so
// the Contact page can say which page the visitor came from.
export function noteRoute(pathname = "") {
  const path = normalizePagePath(pathname);
  if (path === routeCurrent) return;
  if (routeCurrent && !isContactPath(routeCurrent)) writeRoute(routeCurrent);
  routeCurrent = path;
}

// The page a lead originated from: the page whose CTA was clicked, else the last
// non-Contact page in this session, else a same-origin referrer, else "direct".
export function resolveLeadSourcePage(origin) {
  const fromCta = origin?.path ? normalizePagePath(origin.path) : "";
  if (fromCta && !isContactPath(fromCta)) return clip(fromCta);
  const previous = readRoute();
  if (previous && !isContactPath(previous)) return clip(previous);
  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin === window.location.origin) {
      const path = normalizePagePath(referrer.pathname);
      if (!isContactPath(path)) return clip(path);
    }
  } catch {
    // no usable referrer
  }
  return DIRECT;
}

// Router `state` for a service CTA that leads to Contact. It belongs to that one
// navigation (nothing persists), so a later visit to Contact can never inherit it.
export function leadOriginState({ ctaLocation, serviceKey }) {
  return {
    leadOrigin: {
      path: currentPath(),
      ctaLocation: String(ctaLocation ?? ""),
      serviceKey: String(serviceKey ?? ""),
    },
  };
}

/* ---- events ------------------------------------------------------------ */

export function trackServiceCtaClick({
  serviceKey,
  audience,
  ctaLocation,
  ctaLabel,
  language,
}) {
  return trackEvent("service_cta_click", {
    ...describeService(serviceKey, audience),
    page_path: currentPath(),
    language: language ?? languageFromPath(currentPath()),
    cta_location: clip(ctaLocation),
    cta_label: clip(ctaLabel),
  });
}

export function trackContactFormStart({
  serviceKey,
  audience,
  language,
  origin,
}) {
  return trackEvent("contact_form_start", {
    ...describeService(serviceKey, audience),
    page_path: currentPath(),
    language,
    lead_source_page: resolveLeadSourcePage(origin),
  });
}

// Only ever called after the backend confirmed a stored lead.
export function trackContactFormSubmit({
  serviceKey,
  audience,
  language,
  origin,
}) {
  const params = {
    ...describeService(serviceKey, audience),
    page_path: currentPath(),
    language,
    lead_source_page: resolveLeadSourcePage(origin),
  };
  if (origin?.ctaLocation) params.cta_location = clip(origin.ctaLocation);
  return trackEvent("contact_form_submit", params);
}

export const CONTACT_ERROR_TYPES = Object.freeze([
  "validation", // the browser blocked the submit (a required field is missing)
  "server_validation", // the server rejected the fields
  "rate_limited",
  "server_error",
  "request_rejected",
  "network_error",
  "invalid_response", // 2xx without a confirmed lead
]);

export function trackContactFormError({
  errorType,
  errorField,
  serviceKey,
  audience,
  language,
}) {
  const params = {
    error_type: CONTACT_ERROR_TYPES.includes(errorType)
      ? errorType
      : "request_rejected",
    ...describeService(serviceKey, audience),
    page_path: currentPath(),
    language,
  };
  // the field's own name (e.g. "email"), never anything entered into it
  if (errorField) params.error_field = clip(errorField);
  return trackEvent("contact_form_error", params);
}

/* ---- phone / email clicks --------------------------------------------- */

const emailRoles = new Map(
  Object.entries(contactRouting).map(([role, entry]) => [
    String(entry.email).toLowerCase(),
    role.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
  ]),
);

export function linkLocation(element) {
  if (element.closest(".site-footer")) return "footer";
  if (element.closest(".site-header")) return "header";
  if (element.closest(".contact-page")) return "contact_page";
  if (element.closest(".legal-page")) return "legal_page";
  return "page_body";
}

export function classifyContactLink(anchor) {
  const href = anchor.getAttribute("href") || "";
  if (/^tel:/i.test(href)) return { event: "phone_click" };
  if (/^mailto:/i.test(href)) {
    const address = decodeURIComponent(href.slice(7).split("?")[0])
      .trim()
      .toLowerCase();
    return {
      event: "email_click",
      role: emailRoles.get(address) ?? "other",
    };
  }
  return null;
}

// One delegated listener for the whole app. It reports the fact of a click on the
// business's own phone/email links with context, and never the address or number.
export function installContactLinkTracking() {
  if (typeof document === "undefined") return () => {};
  const onClick = (event) => {
    const anchor =
      event.target instanceof window.Element
        ? event.target.closest("a[href]")
        : null;
    if (!anchor) return;
    const kind = classifyContactLink(anchor);
    if (!kind) return;
    const params = {
      page_path: currentPath(),
      language: languageFromPath(currentPath()),
      link_location: linkLocation(anchor),
    };
    if (kind.event === "email_click") params.link_role = kind.role;
    trackEvent(kind.event, params);
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
