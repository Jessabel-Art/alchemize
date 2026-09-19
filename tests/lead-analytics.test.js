import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  CONTACT_ERROR_TYPES,
  classifyContactLink,
  describeService,
  isContactPath,
  languageFromPath,
  leadOriginState,
  linkLocation,
  noteRoute,
  resolveLeadSourcePage,
} from "../src/services/leadAnalytics.js";
import { contactServiceGroups } from "../js/contact-form.js";

const withWindow = (pathname, fn, { referrer = "", stored } = {}) => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const store = new Map(stored ? [["alchemize.leadRoute", stored]] : []);
  globalThis.window = {
    location: { pathname, origin: "https://getalchemize.com" },
    sessionStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
  };
  globalThis.document = { referrer };
  try {
    return fn(store);
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
};

test("every selectable service maps to a stable key, taxonomy category and audience", () => {
  const expected = {
    "individual-tax": ["tax-preparation", "individual"],
    "individual-notary": ["notary-document-services", "individual"],
    "individual-translation": ["translation-apostille-support", "individual"],
    "individual-apostille": ["translation-apostille-support", "individual"],
    "business-readiness": ["business-foundation", "business"],
    "business-advisory": ["business-advisory", "business"],
    "business-operations": ["operations-administration", "business"],
    "business-financial": ["tax-financial-organization", "business"],
    "business-bookkeeping": ["bookkeeping-payroll-support", "business"],
    "business-payroll": ["bookkeeping-payroll-support", "business"],
    "business-digital": ["web-digital-solutions", "business"],
  };
  const keys = new Set(
    contactServiceGroups.flatMap((group) =>
      group.items.map((item) => item.value),
    ),
  );
  assert.deepEqual([...keys].sort(), Object.keys(expected).sort());
  for (const [key, [category, audience]] of Object.entries(expected)) {
    assert.deepEqual(describeService(key), {
      service_key: key,
      service_category: category,
      audience,
    });
  }
});

test("Digital Support keeps the shared service key and is told apart by audience and category", () => {
  assert.deepEqual(describeService("business-digital", "individual"), {
    service_key: "business-digital",
    service_category: "digital-support",
    audience: "individual",
  });
  assert.deepEqual(describeService("business-digital", "business"), {
    service_key: "business-digital",
    service_category: "web-digital-solutions",
    audience: "business",
  });
  // catalog audience names ("individuals") resolve to the form's values
  assert.equal(
    describeService("individual-tax", "individuals").audience,
    "individual",
  );
});

test("unknown, translated or missing services never leak into analytics as free text", () => {
  for (const value of [
    "",
    undefined,
    null,
    "Servicios de traducción",
    "<script>",
    "individual-insurance",
  ]) {
    assert.deepEqual(describeService(value, "business"), {
      service_key: "unspecified",
      service_category: "unspecified",
      audience: "business",
    });
  }
});

test("language is derived from the route so English and Spanish are always labelled", () => {
  assert.equal(languageFromPath("/es"), "es");
  assert.equal(languageFromPath("/es/contact"), "es");
  assert.equal(languageFromPath("/contact"), "en");
  assert.equal(languageFromPath("/espanol"), "en");
  assert.equal(isContactPath("/contact"), true);
  assert.equal(isContactPath("/es/contact/"), true);
  assert.equal(isContactPath("/contact-us"), false);
});

test("phone and email links are classified without exposing the number or address", () => {
  const anchor = (href) => ({ getAttribute: () => href });
  assert.deepEqual(classifyContactLink(anchor("tel:+19106440207")), {
    event: "phone_click",
  });
  assert.deepEqual(
    classifyContactLink(anchor("mailto:hello@getalchemize.com")),
    {
      event: "email_click",
      role: "general",
    },
  );
  assert.equal(
    classifyContactLink(anchor("mailto:START@getalchemize.com?subject=Hi"))
      .role,
    "new_clients",
  );
  assert.equal(
    classifyContactLink(anchor("mailto:support@getalchemize.com")).role,
    "support",
  );
  assert.equal(
    classifyContactLink(anchor("mailto:someone@else.example")).role,
    "other",
  );
  assert.equal(classifyContactLink(anchor("/contact")), null);
  assert.equal(classifyContactLink(anchor("https://instagram.com/x")), null);
  // the result never carries the address or number itself
  const result = JSON.stringify(
    classifyContactLink(anchor("mailto:hello@getalchemize.com")),
  );
  assert.doesNotMatch(result, /@|getalchemize/);
});

test("link location follows the page region the link sits in", () => {
  const inside = (selector) => ({
    closest: (query) => (query === selector ? {} : null),
  });
  assert.equal(linkLocation(inside(".site-footer")), "footer");
  assert.equal(linkLocation(inside(".site-header")), "header");
  assert.equal(linkLocation(inside(".contact-page")), "contact_page");
  assert.equal(linkLocation(inside(".legal-page")), "legal_page");
  assert.equal(linkLocation({ closest: () => null }), "page_body");
});

test("the originating page is the CTA's page, else the last non-contact route, else the referrer, else direct", () => {
  withWindow("/es/contact", () => {
    assert.equal(
      resolveLeadSourcePage({
        path: "/es/services/individuals/notary-document-services?x=1",
      }),
      "/es/services/individuals/notary-document-services",
    );
    // a CTA that says it came from Contact itself is not a source
    assert.equal(resolveLeadSourcePage({ path: "/es/contact" }), "direct");
    assert.equal(resolveLeadSourcePage(null), "direct");
  });
  withWindow(
    "/contact",
    () => {
      assert.equal(resolveLeadSourcePage(null), "/faq");
    },
    { stored: JSON.stringify({ previous: "/faq", at: Date.now() }) },
  );
  // a stale session entry is ignored
  withWindow(
    "/contact",
    () => assert.equal(resolveLeadSourcePage(null), "direct"),
    { stored: JSON.stringify({ previous: "/faq", at: Date.now() - 3600_000 }) },
  );
  withWindow(
    "/contact",
    () => assert.equal(resolveLeadSourcePage(null), "/resources"),
    { referrer: "https://getalchemize.com/resources?utm=x" },
  );
  // an external referrer is GA4's job (source/medium), not a lead_source_page
  withWindow(
    "/contact",
    () => assert.equal(resolveLeadSourcePage(null), "direct"),
    { referrer: "https://www.google.com/" },
  );
});

test("route notes remember the previous non-contact page only", () => {
  withWindow("/", (store) => {
    noteRoute("/services");
    noteRoute("/services/individuals/tax-preparation");
    noteRoute("/contact");
    // leaving Contact does not replace the page that led to it
    noteRoute("/es/faq");
    const saved = JSON.parse(store.get("alchemize.leadRoute"));
    assert.equal(saved.previous, "/services/individuals/tax-preparation");
  });
});

test("CTA router state carries only the page, CTA location and service key", () => {
  withWindow("/es/web-digital", () => {
    assert.deepEqual(
      leadOriginState({
        ctaLocation: "web_hero",
        serviceKey: "business-digital",
      }),
      {
        leadOrigin: {
          path: "/es/web-digital",
          ctaLocation: "web_hero",
          serviceKey: "business-digital",
        },
      },
    );
  });
});

test("error types are a closed list of technical categories", () => {
  assert.deepEqual(
    [...CONTACT_ERROR_TYPES],
    [
      "validation",
      "server_validation",
      "rate_limited",
      "server_error",
      "request_rejected",
      "network_error",
      "invalid_response",
    ],
  );
});

test("lead events are built only from fixed identifiers, never from form values or server text", () => {
  const source = fs.readFileSync(
    new URL("../src/services/leadAnalytics.js", import.meta.url),
    "utf8",
  );
  // every tracker's parameters are identifiers (keys, audience, language,
  // origin, error type/field) - none accepts a name, email, phone or message
  const parameterLists = [
    ...source.matchAll(/export function track\w+\(\{([^}]*)\}/g),
  ].map((match) => match[1]);
  assert.ok(parameterLists.length >= 4);
  for (const list of parameterLists) {
    assert.doesNotMatch(
      list,
      /first|last|name|email|phone|message|business|body|payload/i,
    );
  }
  const form = fs.readFileSync(
    new URL("../js/contact-form.js", import.meta.url),
    "utf8",
  );
  // analytics receives a snapshot of service key, audience and language only
  assert.match(form, /function analyticsSnapshot/);
  assert.doesNotMatch(form, /trackContactForm\w+\(\s*\{[^}]*payload\./s);
  assert.doesNotMatch(form, /contact_form_submitted|trackContactFormSuccess/);
  // conversion requires a stored-lead confirmation, not just an OK status
  assert.match(form, /result\?\.data\?\.leadId/);
  assert.match(form, /confirmed\.duplicate !== true/);
  assert.match(form, /!payload\.website/);
});
