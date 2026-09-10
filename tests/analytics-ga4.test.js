import test from "node:test";
import assert from "node:assert/strict";

import {
  getPageViewPayload,
  isAnalyticsAllowed,
  normalizePagePath,
  shouldTrackRoute,
  trackEvent,
  trackInvoiceCheckoutStarted,
  trackPageView,
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
