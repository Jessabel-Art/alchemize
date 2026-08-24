import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("migrations/016_create_client_intake_architecture.sql");
const definitions = read("server/intake/definitions.php");
const repository = read("server/repositories/intake-repository.php");
const service = read("server/services/intake-service.php");
const admin = read("server/services/intake-admin-service.php");
const portalApi = read("api/v1/portal/index.php");
const phaseTwoMigration = read(
  "migrations/018_add_structured_intake_profile_references.sql",
);
const clientUi = read("src/pages/portal/ClientIntakePage.jsx");
const documentUi = read("src/pages/portal/PortalRecordsPage.jsx");

test("uses engagement-scoped intake assignments without duplicating core entities", () => {
  assert.match(migration, /CREATE TABLE intake_assignments/);
  assert.match(migration, /engagement_id BIGINT UNSIGNED NOT NULL/);
  assert.match(migration, /fk_intake_assignments_engagement/);
  assert.doesNotMatch(
    migration,
    /CREATE TABLE (clients|engagements|documents_metadata)/,
  );
});
test("defines all seven intake components and a deep conditional Web intake", () => {
  for (const key of [
    "client_profile",
    "business_formation",
    "business_consulting",
    "web_digital",
    "notary",
    "document_admin",
    "ongoing_support",
  ])
    assert.match(definitions, new RegExp(`'${key}'`));
  assert.match(definitions, /owns_domain/);
  assert.match(definitions, /show_when/);
  assert.match(definitions, /seo_analytics/);
  assert.match(definitions, /integrations/);
});
test("scopes client intake reads and writes to session-derived client access", () => {
  assert.match(repository, /public_id = :id AND ia.client_id = :client_id/);
  assert.match(service, /\$access\['client_id'\]/);
  assert.match(portalApi, /alchemize_require_authenticated_user/);
  assert.match(portalApi, /alchemize_require_csrf/);
});
test("backs already-on-file status with canonical profile or accepted document data", () => {
  assert.match(service, /ALREADY_ON_FILE_UNAVAILABLE/);
  assert.match(admin, /reusableDocument/);
  assert.match(repository, /status='accepted'/);
  assert.match(migration, /document_id BIGINT UNSIGNED NULL/);
});
test("keeps internal review notes out of client projections", () => {
  assert.doesNotMatch(
    repository,
    /listForClient[\s\S]{0,900}internal_review_notes/,
  );
  assert.match(admin, /internal_review_notes/);
});
test("does not collect credentials or prohibited sensitive fields", () => {
  assert.doesNotMatch(
    definitions,
    /\b(ssn|social security|bank account|password|secret key)\b/i,
  );
  assert.match(definitions, /delegated DNS access/);
});

test("stores engagement profile references as immutable snapshots", () => {
  assert.match(phaseTwoMigration, /CREATE TABLE intake_profile_references/);
  assert.match(phaseTwoMigration, /record_snapshot JSON NOT NULL/);
  assert.match(service, /validateReferences/);
  assert.match(repository, /client_id=:client/);
});

test("scopes address and person mutations to the authenticated client", () => {
  assert.match(
    repository,
    /client_addresses[\s\S]*public_id=:id AND client_id=:client/,
  );
  assert.match(
    repository,
    /client_business_people[\s\S]*public_id=:id AND client_id=:client/,
  );
  assert.match(service, /PROFILE_REFERENCE_INVALID/);
  assert.match(portalApi, /alchemize_require_csrf/);
});

test("uses protected document records for intake upload handoff", () => {
  assert.match(repository, /INSERT INTO documents_metadata/);
  assert.match(repository, /visibility IN \('client','shared'\)/);
  assert.match(service, /prepareRequirementUpload/);
  assert.match(clientUi, /client-portal\/documents\?upload=/);
  assert.doesNotMatch(clientUi, /storage_key|document_storage_root/);
});

test("rejects cross-client or internal existing-document references", () => {
  assert.match(repository, /public_id=:id AND client_id=:client/);
  assert.match(repository, /visibility IN \('client','shared'\)/);
  assert.match(repository, /status='accepted'/);
  assert.match(
    service,
    /authorizedDocument\(\$documentId,\(int\)\$access\['client_id'\],true\)/,
  );
});

test("keeps replacement history without overwriting prior versions", () => {
  assert.match(phaseTwoMigration, /CREATE TABLE intake_requirement_history/);
  assert.match(repository, /next|version_number|intake_requirement_history/i);
  assert.match(admin, /replacement_requested/);
});

test("presents system-owned client statuses and explicit submission closure", () => {
  assert.match(clientUi, /Under review by Alchemize/);
  assert.match(clientUi, /Your intake has been submitted/);
  assert.match(clientUi, /What happens next/);
  assert.match(clientUi, /intake-missing-summary/);
  assert.match(clientUi, /your attention/);
  assert.doesNotMatch(clientUi, /aria-label={`\$\{field\.label\} status`}/);
  assert.match(service, /\$existingApp/);
  assert.match(service, /\$app=in_array\(\$existingApp/);
});

test("keeps secure document handoff in intake context", () => {
  assert.match(clientUi, /context=.*encodeURIComponent/);
  assert.match(clientUi, /section=.*encodeURIComponent/);
  assert.match(documentUi, /You are uploading this file for:/);
  assert.match(documentUi, /Return to this intake/);
});

test("frames formation intake as information for review rather than advice", () => {
  assert.match(definitions, /does not provide legal advice/);
  assert.match(definitions, /not a licensing determination/);
  assert.match(definitions, /leave this open for discussion/);
});
