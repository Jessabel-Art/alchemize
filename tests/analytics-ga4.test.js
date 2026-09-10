import test from "node:test";
import assert from "node:assert/strict";

import {
  getPageViewPayload,
  installAnalytics,
  isAnalyticsAllowed,
  normalizePagePath,
  shouldTrackRoute,
  trackEvent,
  trackInvoiceCheckoutStarted,
  trackPageView,
  trackResourceDownload,
} from "../src/services/analytics.js";

test("GA4 is disabled in dev/test and enabled only on production canonical hosts with a valid ID", () => {
  assert.equal(
    isAnalyticsAllowed({
      mode: "production",
      hostname: "getalchemize.com",
      measurementId: "G-ABC123",
    }),
    true,
  );

  assert.equal(
    isAnalyticsAllowed({
      mode: "production",
      hostname: "www.getalchemize.com",
      measurementId: "G-ABC123",
    }),
    true,
  );

  assert.equal(
    isAnalyticsAllowed({
      mode: "production",
      hostname: "localhost",
      measurementId: "G-ABC123",
    }),
    false,
  );

  assert.equal(
    isAnalyticsAllowed({
      mode: "development",
      hostname: "getalchemize.com",
      measurementId: "G-ABC123",
    }),
    false,
  );

  assert.equal(
    isAnalyticsAllowed({
      mode: "test",
      hostname: "getalchemize.com",
      measurementId: "G-ABC123",
    }),
    false,
  );

  assert.equal(
    isAnalyticsAllowed({
      mode: "production",
      hostname: "getalchemize.com",
      measurementId: "",
    }),
    false,
  );
});

test("GA4 page paths are normalized and exclude private admin and portal routes", () => {
  assert.equal(
    normalizePagePath("/services/businesses/"),
    "/services/businesses",
  );
  assert.equal(normalizePagePath("/"), "/");
  assert.equal(normalizePagePath("/contact?service=website"), "/contact");
  assert.equal(normalizePagePath("/contact?token=abc#details"), "/contact");
  assert.equal(normalizePagePath(""), "/");
  assert.equal(shouldTrackRoute("/admin/settings"), false);
  assert.equal(shouldTrackRoute("/client-portal/dashboard"), false);
  assert.equal(shouldTrackRoute("/resources/insights"), true);
  assert.equal(shouldTrackRoute("/es/contact"), true);
  assert.equal(shouldTrackRoute("/es"), true);
});

test("GA4 payloads stay privacy-safe and avoid leaking raw query strings or tokens", () => {
  const payload = getPageViewPayload({
    pathname: "/contact?service=website&token=abc#section",
    title: "Contact | Alchemize Business Services",
    origin: "https://getalchemize.com",
  });

  assert.equal(payload.page_path, "/contact");
  assert.equal(payload.page_location, "https://getalchemize.com/contact");
  assert.equal(payload.page_title, "Contact | Alchemize Business Services");
  assert.equal(payload.page_path.includes("?"), false);
  assert.equal(payload.page_path.includes("token"), false);
});

test("SPA pageviews do not double-fire and conversion events are safe", () => {
  const calls = [];
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  globalThis.window = {
    location: {
      hostname: "getalchemize.com",
      origin: "https://getalchemize.com",
    },
    dataLayer: [],
    gtag: (...args) => calls.push(args),
    __alchemize_ga4_last_page: undefined,
  };
  globalThis.document = {
    getElementById: () => null,
    head: { appendChild: () => {} },
    title: "Contact | Alchemize Business Services",
  };

  try {
    const first = trackPageView(
      {
        pathname: "/contact?service=website",
        title: "Contact | Alchemize Business Services",
        origin: "https://getalchemize.com",
      },
      {
        mode: "production",
        hostname: "getalchemize.com",
        measurementId: "G-ABC123",
      },
    );
    const second = trackPageView(
      {
        pathname: "/contact?service=website",
        title: "Contact | Alchemize Business Services",
        origin: "https://getalchemize.com",
      },
      {
        mode: "production",
        hostname: "getalchemize.com",
        measurementId: "G-ABC123",
      },
    );

    assert.deepEqual(first, {
      page_path: "/contact",
      page_location: "https://getalchemize.com/contact",
      page_title: "Contact | Alchemize Business Services",
    });
    assert.deepEqual(second, first);
    assert.equal(
      calls.filter(([eventName]) => eventName === "event").length,
      1,
    );

    const thirdRouteChange = trackPageView(
      {
        pathname: "/services",
        title: "Services | Alchemize Business Services",
        origin: "https://getalchemize.com",
      },
      {
        mode: "production",
        hostname: "getalchemize.com",
        measurementId: "G-ABC123",
      },
    );

    assert.deepEqual(thirdRouteChange, {
      page_path: "/services",
      page_location: "https://getalchemize.com/services",
      page_title: "Services | Alchemize Business Services",
    });
    assert.equal(
      calls.filter(([eventName]) => eventName === "event").length,
      2,
    );

    const contactEvent = trackEvent(
      "contact_form_submitted",
      {
        form_type: "contact",
        email: "person@example.com",
        message: "hello",
      },
      {
        mode: "production",
        hostname: "getalchemize.com",
        measurementId: "G-ABC123",
      },
    );

    assert.deepEqual(contactEvent, { form_type: "contact" });
    assert.equal(
      calls.some((args) => args[1] === "contact_form_submitted"),
      true,
    );

    const stripeEvent = trackInvoiceCheckoutStarted("stripe", {
      mode: "production",
      hostname: "getalchemize.com",
      measurementId: "G-ABC123",
    });
    const paypalEvent = trackInvoiceCheckoutStarted("paypal", {
      mode: "production",
      hostname: "getalchemize.com",
      measurementId: "G-ABC123",
    });

    assert.deepEqual(stripeEvent, {
      provider: "stripe",
      payment_type: "invoice",
    });
    assert.deepEqual(paypalEvent, {
      provider: "paypal",
      payment_type: "invoice",
    });
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
});

test("GA4 tagging script is inserted exactly once with the correct measurement ID, and gtag config is initialized once", () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const appended = [];
  let insertedScript = null;

  globalThis.window = {
    location: {
      hostname: "getalchemize.com",
      origin: "https://getalchemize.com",
      pathname: "/",
    },
    dataLayer: [],
  };
  globalThis.document = {
    getElementById: (id) => (id === "ga4-tag" ? insertedScript : null),
    createElement: () => ({}),
    head: {
      appendChild: (script) => {
        insertedScript = script;
        appended.push(script);
      },
    },
  };

  try {
    const runtime = {
      mode: "production",
      hostname: "getalchemize.com",
      measurementId: "G-9151VZXWM7",
    };

    installAnalytics(runtime);
    installAnalytics(runtime);
    installAnalytics(runtime);

    assert.equal(appended.length, 1);
    assert.equal(appended[0].id, "ga4-tag");
    assert.equal(
      appended[0].src,
      "https://www.googletagmanager.com/gtag/js?id=G-9151VZXWM7",
    );

    assert.equal(window.dataLayer.length, 2);
    assert.equal(window.dataLayer[0][0], "js");
    assert.equal(window.dataLayer[1][0], "config");
    assert.equal(window.dataLayer[1][1], "G-9151VZXWM7");
    assert.equal(window.dataLayer[1][2].send_page_view, false);
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
});

test("GA4 conversion events are not sent from admin or client-portal routes even when enabled", () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const calls = [];

  globalThis.window = {
    location: {
      hostname: "getalchemize.com",
      origin: "https://getalchemize.com",
    },
    dataLayer: [],
    gtag: (...args) => calls.push(args),
  };
  globalThis.document = {
    getElementById: () => null,
    head: { appendChild: () => {} },
  };

  try {
    const runtime = {
      mode: "production",
      hostname: "getalchemize.com",
      measurementId: "G-9151VZXWM7",
    };

    const portalResult = trackEvent(
      "invoice_checkout_started",
      { provider: "stripe", payment_type: "invoice" },
      { ...runtime, pathname: "/client-portal/billing" },
    );
    const adminResult = trackEvent(
      "resource_download",
      { resource_slug: "consultation-preparation-workbook" },
      { ...runtime, pathname: "/admin/dashboard" },
    );
    const publicResult = trackEvent(
      "resource_download",
      { resource_slug: "consultation-preparation-workbook" },
      { ...runtime, pathname: "/resources" },
    );

    assert.equal(portalResult, null);
    assert.equal(adminResult, null);
    assert.notEqual(publicResult, null);
    assert.equal(calls.length, 1);
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
});

test("trackResourceDownload sends a sanitized, non-PII resource identifier from public routes", () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const calls = [];

  globalThis.window = {
    location: {
      hostname: "getalchemize.com",
      origin: "https://getalchemize.com",
      pathname: "/resources",
    },
    dataLayer: [],
    gtag: (...args) => calls.push(args),
  };
  globalThis.document = {
    getElementById: () => null,
    head: { appendChild: () => {} },
  };

  try {
    const result = trackResourceDownload("Consultation-Preparation-Workbook", {
      mode: "production",
      hostname: "getalchemize.com",
      measurementId: "G-9151VZXWM7",
    });

    assert.deepEqual(result, {
      resource_slug: "consultation-preparation-workbook",
      resource_type: "workbook",
    });
    assert.equal(
      calls.some((args) => args[1] === "resource_download"),
      true,
    );
    assert.equal(trackResourceDownload("", {}), null);
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
});

test("analytics failures are non-blocking and do not expose sensitive payload keys", () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  globalThis.window = {
    location: {
      hostname: "getalchemize.com",
      origin: "https://getalchemize.com",
    },
    dataLayer: [],
    gtag: () => {
      throw new Error("GA4 failed");
    },
  };
  globalThis.document = {
    getElementById: () => null,
    head: { appendChild: () => {} },
  };

  try {
    assert.doesNotThrow(() =>
      trackEvent(
        "invoice_checkout_started",
        {
          provider: "stripe",
          payment_type: "invoice",
          invoice_number: "INV-123",
          customer_email: "person@example.com",
        },
        {
          mode: "production",
          hostname: "getalchemize.com",
          measurementId: "G-ABC123",
        },
      ),
    );

    const result = trackEvent(
      "invoice_checkout_started",
      {
        provider: "stripe",
        payment_type: "invoice",
        invoice_number: "INV-123",
        customer_email: "person@example.com",
      },
      {
        mode: "production",
        hostname: "getalchemize.com",
        measurementId: "G-ABC123",
      },
    );

    assert.equal(result, null);
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
});
