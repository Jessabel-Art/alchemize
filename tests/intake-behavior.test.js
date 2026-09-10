import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import {
  intakeState,
  isVisible,
  hasAnswer,
} from "../src/pages/portal/intake-logic.js";
const definitions = JSON.parse(
  execFileSync(
    "php",
    [
      "-r",
      "require 'server/intake/definitions.php'; echo json_encode(alchemize_intake_definitions());",
    ],
    { encoding: "utf8" },
  ),
);
const web = definitions.web_digital;
const answer = (value) => ({ value, applicability: "required" });
const field = (key) =>
  web.modules.flatMap((m) => m.fields).find((f) => f.key === key);
test("catalog codes resolve consulting and web families independently", () => {
  const result = JSON.parse(
    execFileSync(
      "php",
      [
        "-r",
        "require 'server/intake/definitions.php'; echo json_encode([alchemize_intake_service_families(['business-consulting']),alchemize_intake_service_families(['website-design','website-maintenance','seo']),alchemize_intake_service_families(['unknown'])]);",
      ],
      { encoding: "utf8" },
    ),
  );
  assert.deepEqual(result, [["business_consulting"], ["web_digital"], []]);
  assert.ok(
    definitions.business_consulting.modules.some(
      (m) => m.key === "business_context",
    ),
  );
  assert.ok(
    !definitions.business_consulting.modules.some(
      (m) => m.key === "domain_dns",
    ),
  );
});

test("specialized service families resolve to the correct intake definitions", () => {
  const result = JSON.parse(
    execFileSync(
      "php",
      [
        "-r",
        "require 'server/intake/definitions.php'; echo json_encode([alchemize_intake_service_families(['business-consulting']),alchemize_intake_service_families(['digital-automation']),alchemize_intake_service_families(['translation']),alchemize_intake_service_families(['apostille']),alchemize_intake_service_families(['administrative-support'])]);",
      ],
      { encoding: "utf8" },
    ),
  );
  assert.deepEqual(result, [
    ["business_consulting"],
    ["web_digital"],
    ["translation"],
    ["apostille"],
    ["ongoing_support"],
  ]);
  assert.deepEqual(
    definitions.translation.modules
      .flatMap((module) => module.fields)
      .map((field) => field.key)
      .slice(0, 10),
    [
      "document_type",
      "source_language",
      "target_language",
      "document_count",
      "page_count",
      "certified_translation",
      "intended_use",
      "receiving_organization",
      "destination_country",
      "formatting_requirements",
    ],
  );
  assert.deepEqual(
    definitions.apostille.modules
      .flatMap((module) => module.fields)
      .map((field) => field.key)
      .slice(0, 10),
    [
      "document_type",
      "document_count",
      "issuing_state",
      "destination_country",
      "document_status",
      "notarized_before_apostille",
      "translation_also_needed",
      "filing_deadline",
      "delivery_requirements",
      "special_instructions",
    ],
  );
  assert.equal(
    definitions.translation.modules
      .flatMap((module) => module.fields)
      .some((field) => field.key === "source_language"),
    true,
  );
  assert.equal(
    definitions.apostille.modules
      .flatMap((module) => module.fields)
      .some((field) => field.key === "document_status"),
    true,
  );
  assert.equal(
    definitions.translation.modules
      .flatMap((module) => module.fields)
      .some((field) => field.key === "project_goals"),
    false,
  );
  assert.equal(
    definitions.apostille.modules
      .flatMap((module) => module.fields)
      .some((field) => field.key === "project_goals"),
    false,
  );
});
test("conditional children and documents respond to controlling answers", () => {
  for (const [key, control, value] of [
    ["domain_name", "owns_domain", "yes"],
    ["hosting_migration", "existing_host", "yes"],
    ["email_migration", "professional_email_exists", "yes"],
    ["existing_copy_details", "existing_copy", "partial"],
    ["copywriting_details", "copywriting_help", "yes"],
    ["target_locations", "seo_requested", "yes"],
  ]) {
    assert.equal(isVisible(field(key), {}), false);
    assert.equal(isVisible(field(key), { [control]: value }), true);
  }
  const docs = web.modules.flatMap((m) => m.requirements);
  for (const [key, control] of [
    ["logo", "logo_available"],
    ["brand_guidelines", "brand_guidelines"],
    ["existing_copy", "existing_copy"],
  ]) {
    const doc = docs.find((d) => d.key === key);
    assert.equal(isVisible(doc, { [control]: "no" }), false);
    assert.equal(isVisible(doc, { [control]: "yes" }), true);
  }
});
test("hidden required fields do not block sections, summary or progress; visible ones do", () => {
  const definition = {
    modules: [web.modules.find((m) => m.key === "integrations")],
  };
  assert.equal(intakeState(definition, {}).progress, 100);
  let draft = { integrations: answer(["crm"]) };
  assert.equal(
    intakeState(definition, draft).missing[0].fieldKey,
    "integration_notes",
  );
  draft.integration_notes = answer("Connect customer records");
  assert.equal(intakeState(definition, draft).progress, 100);
  draft.integrations = answer([]);
  assert.equal(intakeState(definition, draft).missing.length, 0);
  assert.equal(draft.integration_notes.value, "Connect customer records");
  draft.integrations = answer(["crm"]);
  assert.equal(
    intakeState(definition, JSON.parse(JSON.stringify(draft))).progress,
    100,
  );
});
test("conditional required document uses the same completion calculation", () => {
  const branding = web.modules.find((m) => m.key === "branding");
  const requirements = [
    {
      id: "logo",
      requirement_key: "logo",
      requirement_name: "Logo",
      necessity: "required",
      status: "missing",
    },
  ];
  assert.equal(
    intakeState(
      { modules: [branding] },
      { logo_available: answer("no") },
      requirements,
    ).missing.length,
    0,
  );
  assert.equal(
    intakeState(
      { modules: [branding] },
      { logo_available: answer("yes") },
      requirements,
    ).missing[0].key,
    "requirement-logo",
  );
  requirements[0].status = "under_review";
  assert.equal(
    intakeState(
      { modules: [branding] },
      { logo_available: answer("yes") },
      requirements,
    ).progress,
    100,
  );
});
test("section conditions, whitespace, false answers and PHP condition parity", () => {
  assert.equal(hasAnswer(answer("   ")), false);
  assert.equal(hasAnswer(answer(false)), true);
  const definition = {
    modules: [
      {
        key: "conditional",
        show_when: { field: "enabled", equals: true },
        fields: [{ key: "needed", required: true }],
        requirements: [],
      },
    ],
  };
  assert.equal(intakeState(definition, {}).missing.length, 0);
  assert.equal(
    intakeState(definition, { enabled: answer(true) }).missing.length,
    1,
  );
  const conditions = [
    {
      all: [
        { field: "a", equals: "yes" },
        { field: "b", in: ["partial", "yes"] },
      ],
    },
    {
      any: [
        { field: "a", equals: "yes" },
        { field: "b", equals: "yes" },
      ],
    },
    { field: "list", not_empty: true },
  ];
  const values = { a: "yes", b: "partial", list: ["crm"] };
  const php = JSON.parse(
    execFileSync(
      "php",
      [
        "-r",
        "require 'server/intake/definitions.php'; $data=json_decode(stream_get_contents(STDIN),true); echo json_encode(array_map(fn($c)=>alchemize_intake_visible(['show_when'=>$c],$data[1]),$data[0]));",
      ],
      { input: JSON.stringify([conditions, values]), encoding: "utf8" },
    ),
  );
  assert.deepEqual(
    php,
    conditions.map((c) => isVisible({ show_when: c }, values)),
  );
});
