const GA4_ALLOWED_HOSTNAMES = new Set([
  "getalchemize.com",
  "www.getalchemize.com",
]);

const PRIVATE_ROUTE_PREFIXES = ["/admin", "/client-portal"];
const SENSITIVE_EVENT_KEYS =
  /(^|_)(email|name|phone|message|note|content|filename|invoice|token|password|secret|credential|address|tax|ssn|id)$/i;

export function isAnalyticsAllowed({
  mode = "development",
  hostname = "",
  measurementId = "",
} = {}) {
  const normalizedMode = String(mode).trim().toLowerCase();
  const normalizedHost = String(hostname).trim().toLowerCase();
  const normalizedMeasurementId = String(measurementId).trim();

  if (!normalizedMeasurementId) return false;
  if (normalizedMode !== "production") return false;
  if (!normalizedHost) return false;
  if (!GA4_ALLOWED_HOSTNAMES.has(normalizedHost)) return false;

  return true;
}

export function normalizePagePath(pathname = "") {
  const rawValue = String(pathname ?? "");
  const withoutQuery = rawValue.split(/[?#]/, 1)[0] || "/";
  const withoutHash = withoutQuery.split("#", 1)[0] || "/";
  const normalized = withoutHash.trim() || "/";
  const trimmed = normalized === "/" ? "/" : normalized.replace(/\/+$/, "");

  return trimmed || "/";
}

export function resolveAnalyticsRuntime(overrides = {}) {
  const runtimeMode = String(
    overrides.mode ??
      import.meta.env?.MODE ??
      (typeof window !== "undefined" ? "production" : "development"),
  )
    .trim()
    .toLowerCase();
  const runtimeHostname = String(
    overrides.hostname ??
      (typeof window !== "undefined" ? window.location.hostname : ""),
  )
    .trim()
    .toLowerCase();
  const runtimeMeasurementId = String(
    overrides.measurementId ?? import.meta.env?.VITE_ANALYTICS_ID ?? "",
  ).trim();
  const runtimePathname = String(
    overrides.pathname ??
      (typeof window !== "undefined" ? window.location.pathname : "/"),
  ).trim();

  return {
    mode: runtimeMode,
    hostname: runtimeHostname,
    measurementId: runtimeMeasurementId,
    pathname: runtimePathname,
    enabled:
      overrides.enabled ??
      isAnalyticsAllowed({
        mode: runtimeMode,
        hostname: runtimeHostname,
        measurementId: runtimeMeasurementId,
      }),
  };
}

export function getAnalyticsConfig() {
  return resolveAnalyticsRuntime();
}

export function getPageViewPayload({
  pathname = "",
  title = "",
  origin = "",
} = {}) {
  const safeOrigin = String(
    origin ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "https://getalchemize.com"),
  ).replace(/\/+$/, "");
  const safePath = normalizePagePath(
    pathname ||
      (typeof window !== "undefined" ? window.location.pathname : "/"),
  );
  const safeTitle = String(
    title || document?.title || "Alchemize Business Services",
  );
  const pageUrl = new URL(safePath, safeOrigin).toString();

  return {
    page_path: safePath,
    page_location: pageUrl,
    page_title: safeTitle,
  };
}

function sanitizeEventPayload(input = {}) {
  return Object.fromEntries(
    Object.entries(input ?? {})
      .filter(([key, value]) => {
        if (value === undefined || value === null) return false;
        if (SENSITIVE_EVENT_KEYS.test(key)) return false;
        return !Array.isArray(value) && typeof value !== "object";
      })
      .map(([key, value]) => [key, String(value)]),
  );
}

export function installAnalytics(runtime = {}) {
  if (typeof window === "undefined") return false;

  const config = resolveAnalyticsRuntime(runtime);
  if (!config.enabled) return false;

  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };

    if (!document.getElementById("ga4-tag")) {
      const script = document.createElement("script");
      script.id = "ga4-tag";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.measurementId)}`;
      document.head.appendChild(script);
    }

    if (!window.__alchemize_ga4_initialized) {
      window.gtag("js", new Date());
      window.gtag("config", config.measurementId, {
        send_page_view: false,
        anonymize_ip: true,
        cookie_flags: "SameSite=None;Secure",
      });
      window.__alchemize_ga4_initialized = true;
    }

    return true;
  } catch {
    return false;
  }
}

export function shouldTrackRoute(pathname = "") {
  const normalizedPath = normalizePagePath(pathname);
  return !PRIVATE_ROUTE_PREFIXES.some(
    (prefix) =>
      normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
}

export function trackPageView(
  { pathname = "", title = "", origin = "" } = {},
  runtime = {},
) {
  const config = resolveAnalyticsRuntime(runtime);
  if (!config.enabled || !shouldTrackRoute(pathname)) return null;

  try {
    installAnalytics(config);

    const payload = getPageViewPayload({ pathname, title, origin });
    const trackingKey = `${payload.page_path}|${payload.page_title}`;
    const previousKey = window?.__alchemize_ga4_last_page;

    if (previousKey === trackingKey) {
      return payload;
    }

    window.gtag?.("event", "page_view", {
      page_path: payload.page_path,
      page_location: payload.page_location,
      page_title: payload.page_title,
    });

    window.__alchemize_ga4_last_page = trackingKey;
    return payload;
  } catch {
    return null;
  }
}

export function trackEvent(eventName = "", eventParams = {}, runtime = {}) {
  const config = resolveAnalyticsRuntime(runtime);
  if (!config.enabled || !eventName) return null;
  if (!shouldTrackRoute(config.pathname)) return null;

  try {
    installAnalytics(config);
    const safeParams = sanitizeEventPayload(eventParams);
    window.gtag?.("event", eventName, safeParams);
    return safeParams;
  } catch {
    return null;
  }
}

export function trackContactFormSuccess(runtime = {}) {
  return trackEvent(
    "contact_form_submitted",
    { form_type: "contact", source: "public" },
    runtime,
  );
}

export function trackSchedulingSuccess(runtime = {}) {
  return trackEvent(
    "appointment_scheduled",
    { booking_type: "public_scheduling" },
    runtime,
  );
}

export function trackResourceDownload(resourceSlug, runtime = {}) {
  const normalizedSlug = String(resourceSlug || "")
    .trim()
    .toLowerCase();
  if (!normalizedSlug) return null;

  return trackEvent(
    "resource_download",
    { resource_slug: normalizedSlug, resource_type: "workbook" },
    runtime,
  );
}

export function trackIntakeSubmitted(runtime = {}) {
  return trackEvent("intake_submitted", { intake_type: "client" }, runtime);
}

export function trackDocumentUploaded(runtime = {}) {
  return trackEvent(
    "document_uploaded",
    { document_type: "client_upload" },
    runtime,
  );
}

export function trackAppointmentRequested(runtime = {}) {
  return trackEvent(
    "appointment_requested",
    { booking_type: "client" },
    runtime,
  );
}

export function trackInvoiceCheckoutStarted(provider, runtime = {}) {
  const normalizedProvider = String(provider || "")
    .trim()
    .toLowerCase();
  if (!normalizedProvider) return null;

  return trackEvent(
    "invoice_checkout_started",
    {
      provider: normalizedProvider,
      payment_type: "invoice",
    },
    runtime,
  );
}
