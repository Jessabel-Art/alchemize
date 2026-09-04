import test from "node:test";
import assert from "node:assert/strict";

import {
  documentTypeCatalog,
  getDocumentTypeOptionsForService,
  getDocumentTypeOptionsForEngagement,
} from "../src/data/documentTypeCatalog.js";

test("bookkeeping document types include the canonical statement documents and custom fallback", () => {
  const options = getDocumentTypeOptionsForService("bookkeeping");

  assert.ok(options.some((option) => option.value === "bank_statement"));
  assert.ok(options.some((option) => option.value === "credit_card_statement"));
  assert.ok(options.at(-1).value === "custom_document");
  assert.equal(options.at(-1).label, "Other / Custom Document");
});

test("shared canonical document types can be reused across services", () => {
  const bookkeeping = getDocumentTypeOptionsForService("bookkeeping");
  const businessFormation =
    getDocumentTypeOptionsForService("business-formation");

  assert.ok(bookkeeping.some((option) => option.value === "ein_confirmation"));
  assert.ok(
    businessFormation.some((option) => option.value === "ein_confirmation"),
  );
  assert.ok(
    documentTypeCatalog.ein_confirmation.label === "EIN Confirmation Letter",
  );
});

test("unsupported engagement services safely fall back to custom-only document types", () => {
  const options = getDocumentTypeOptionsForService("unknown-service");

  assert.deepEqual(options, [
    { value: "custom_document", label: "Other / Custom Document" },
  ]);
});

test("engagement helpers resolve service codes and preserve the custom option order", () => {
  const options = getDocumentTypeOptionsForEngagement(
    {
      id: "eng-1",
      serviceId: "svc-1",
      serviceCode: "website-design",
    },
    {
      byId: {
        "svc-1": { serviceCode: "website-design" },
      },
    },
  );

  assert.ok(options.some((option) => option.value === "logo_brand_assets"));
  assert.ok(options.some((option) => option.value === "custom_document"));
  assert.equal(options.at(-1).value, "custom_document");
});
