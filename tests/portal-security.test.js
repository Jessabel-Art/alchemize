import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("portal access is derived from the authenticated user", () => {
  const endpoint = read("api/v1/portal/index.php");
  const service = read("server/services/portal-service.php");
  const repository = read("server/repositories/portal-repository.php");

  assert.match(endpoint, /alchemize_require_authenticated_user\(\)/);
  assert.match(endpoint, /resolveAccess\(\$sessionUser\)/);
  assert.doesNotMatch(endpoint, /\$_(?:GET|POST|REQUEST)\[['"]client_id['"]\]/);
  assert.match(service, /\['client', 'business-authorized-user'\]/);
  assert.match(repository, /WHERE cag\.user_id = :user_id/);
});

test("login routes portal roles to the canonical client dashboard", () => {
  const loginPage = read("src/pages/auth/AuthPage.jsx");
  assert.match(
    loginPage,
    /\["client", "business-authorized-user"\]\.includes\(user\?\.role_slug\)/,
  );
  assert.match(loginPage, /"\/client-portal\/dashboard"/);
  assert.match(
    loginPage,
    /navigate\(authenticatedDestination\(sessionData\?\.user\)/,
  );
});

test("all portal record families are scoped by the resolved client", () => {
  const repository = read("server/repositories/portal-repository.php");
  for (const table of [
    "engagements",
    "tasks",
    "documents_metadata",
    "appointments",
    "invoices",
    "payments",
    "activity_events",
  ]) {
    assert.match(
      repository,
      new RegExp(`${table}[\\s\\S]*?:client_id`),
      `${table} must use a bound client scope`,
    );
  }
  assert.match(repository, /t\.visibility IN \(\\'client\\', \\'both\\'\)/);
  assert.match(repository, /d\.visibility IN \(\\'client\\', \\'shared\\'\)/);
  assert.match(repository, /a\.visibility IN \(\\'client\\', \\'both\\'\)/);
  assert.match(repository, /visibility IN \(\\'client\\', \\'both\\'\)/);
});

test("client serializers do not select internal-only fields", () => {
  const portalFiles = [
    read("server/repositories/portal-repository.php"),
    read("server/services/portal-service.php"),
    read("api/v1/portal/index.php"),
  ].join("\n");

  for (const field of [
    "internal_notes",
    "internal_note",
    "pricing_notes",
    "scope_notes",
    "storage_key",
    "external_reference",
    "note_body",
    "request_metadata",
  ]) {
    assert.equal(
      portalFiles.includes(field),
      false,
      `${field} must not enter a portal response path`,
    );
  }
});

test("the forward migration establishes access grants and client visibility", () => {
  const migration = read(
    "migrations/009_create_client_access_and_visibility.sql",
  );
  assert.match(migration, /CREATE TABLE client_access_grants/);
  assert.match(
    migration,
    /UNIQUE KEY uq_client_access_grants_user_client \(user_id, client_id\)/,
  );
  assert.match(
    migration,
    /ALTER TABLE tasks[\s\S]*visibility ENUM\('admin','client','both'\)/,
  );
  assert.match(
    migration,
    /ALTER TABLE appointments[\s\S]*visibility ENUM\('admin','client','both'\)/,
  );
  assert.doesNotMatch(migration, /^\s*(?:DROP|TRUNCATE|DELETE)\b/im);
});

test("admin operational endpoints reject client roles through role guards", () => {
  for (const resource of [
    "leads",
    "clients",
    "services",
    "engagements",
    "tasks",
    "documents",
    "appointments",
    "invoices",
    "payments",
    "notes",
  ]) {
    const endpoint = read(`api/v1/${resource}/index.php`);
    assert.match(
      endpoint,
      /alchemize_require_(?:read_only_or_higher|staff_or_admin)\(\)/,
      `${resource} needs an operational role guard`,
    );
  }
});

test("Phase 2 mutations require CSRF and session-derived access", () => {
  const endpoint = read("api/v1/portal/index.php");
  assert.match(endpoint, /alchemize_require_authenticated_user\(\)/);
  assert.match(endpoint, /resolveAccess\(\$sessionUser\)/);
  assert.match(endpoint, /alchemize_require_csrf\(\)/);
  assert.doesNotMatch(endpoint, /\$_(?:GET|POST|REQUEST)\[['"]client_id['"]\]/);
});

test("task, document, appointment, message, and acknowledgement mutations bind client ownership", () => {
  const repository = read("server/repositories/portal-action-repository.php");
  for (const method of [
    "findTask",
    "findDocument",
    "findThread",
    "findAppointment",
    "entityBelongsToClient",
  ]) {
    assert.match(
      repository,
      new RegExp(`function ${method}[\\s\\S]*?:client_id`),
      `${method} must bind a client scope`,
    );
  }
  assert.match(repository, /visibility IN \(\\'client\\', \\'both\\'\)/);
  assert.match(repository, /visibility IN \(\\'client\\', \\'shared\\'\)/);
});

test("invalid duplicate and terminal state transitions are rejected", () => {
  const service = read("server/services/portal-action-service.php");
  assert.match(service, /TASK_ALREADY_COMPLETED/);
  assert.match(service, /DOCUMENT_NOT_ACCEPTING_UPLOADS/);
  assert.match(service, /THREAD_ARCHIVED/);
  assert.match(service, /APPOINTMENT_STATE_INVALID/);
  assert.match(service, /PROFILE_CHANGE_PENDING/);
  assert.match(service, /AlchemizeRequestException\(409/);
});

test("private uploads validate content and remain outside public paths", () => {
  const storage = read("server/services/document-storage-service.php");
  const config = read("server/config/config.php");
  assert.match(storage, /finfo\(FILEINFO_MIME_TYPE\)/);
  assert.match(storage, /is_uploaded_file/);
  assert.match(storage, /move_uploaded_file/);
  assert.match(storage, /MAXIMUM_BYTES = 15 \* 1024 \* 1024/);
  assert.match(storage, /bin2hex\(random_bytes\(24\)\)/);
  assert.match(config, /ALCHEMIZE_DOCUMENT_STORAGE_ROOT/);
  assert.match(config, /storage\/client-documents/);
  assert.doesNotMatch(config, /public\/storage|public_html/);
});

test("messages use dedicated thread tables and never the internal notes table", () => {
  const migration = read("migrations/010_create_client_portal_actions.sql");
  const actionRepository = read(
    "server/repositories/portal-action-repository.php",
  );
  assert.match(migration, /CREATE TABLE message_threads/);
  assert.match(migration, /CREATE TABLE messages/);
  assert.match(actionRepository, /FROM message_threads/);
  assert.match(actionRepository, /INSERT INTO messages/);
  assert.doesNotMatch(actionRepository, /\bnotes\b|note_body|internal_notes/);
});

test("profile sensitive changes and appointment changes use review queues", () => {
  const migration = read("migrations/010_create_client_portal_actions.sql");
  const service = read("server/services/portal-action-service.php");
  assert.match(migration, /CREATE TABLE profile_change_requests/);
  assert.match(migration, /CREATE TABLE appointment_change_requests/);
  assert.match(service, /createProfileChange/);
  assert.match(service, /createAppointmentRequest/);
  assert.match(
    service,
    /\['primary_phone', 'primary_email', 'preferred_contact_method', 'language_preference'\]/,
  );
});

test("every material client action records activity and sensitive actions record audit events", () => {
  const service = read("server/services/portal-action-service.php");
  for (const event of [
    "client.task.",
    "client.document.uploaded",
    "client.message.sent",
    "client.appointment.",
    "client.profile.updated",
    "client.profile.change_requested",
    "client.acknowledged",
  ])
    assert.ok(service.includes(event), `missing ${event} activity event`);
  assert.match(service, /AlchemizeAuditEventRepository/);
  assert.match(service, /client\.document\.uploaded/);
  assert.match(service, /client\.profile\.updated/);
});

test("Admin receives a persisted attention queue and explicit review destinations", () => {
  const endpoint = read("api/v1/portal-admin/index.php");
  const repository = read("server/repositories/portal-admin-repository.php");
  assert.match(endpoint, /alchemize_require_staff_or_admin\(\)/);
  assert.match(endpoint, /alchemize_require_csrf\(\)/);
  for (const table of [
    "task_client_actions",
    "document_submissions",
    "messages",
    "appointment_change_requests",
    "profile_change_requests",
  ]) {
    assert.ok(repository.includes(table), `${table} must feed Admin attention`);
  }
  assert.doesNotMatch(repository, /note_body|internal_notes/);
});

test("Phase 2 migration is forward-only and defines workflow foreign keys", () => {
  const migration = read("migrations/010_create_client_portal_actions.sql");
  for (const table of [
    "task_client_actions",
    "document_submissions",
    "message_threads",
    "messages",
    "appointment_change_requests",
    "profile_change_requests",
    "record_acknowledgements",
  ]) {
    assert.match(migration, new RegExp(`CREATE TABLE ${table}`));
  }
  assert.doesNotMatch(migration, /^\s*(?:DROP|TRUNCATE|DELETE)\b/im);
  assert.match(migration, /FOREIGN KEY \(client_id\) REFERENCES clients/);
  assert.match(migration, /actor_user_id/);
});

test("Phase 3 attention, onboarding, and badges derive from scoped persisted records", () => {
  const service = read("server/services/portal-service.php");
  const repository = read("server/repositories/portal-repository.php");
  const layout = read("src/layouts/ClientPortalLayout.jsx");
  assert.match(service, /buildAttention\(/);
  assert.match(service, /navigation_counts/);
  assert.match(service, /onboarding\(/);
  assert.match(repository, /WHERE client_id = :client_id/);
  assert.match(layout, /count: counts\[/);
  assert.match(layout, /\|\| 0/);
});

test("Phase 3 authorized-user requests require primary contact and Admin approval", () => {
  const migration = read(
    "migrations/012_create_client_portal_phase_3_operations.sql",
  );
  const service = read("server/services/portal-action-service.php");
  const admin = read("server/repositories/portal-admin-repository.php");
  assert.match(migration, /CREATE TABLE authorized_user_requests/);
  assert.match(service, /access_role.*primary_contact/);
  assert.match(service, /ACCESS_REQUEST_NOT_PERMITTED/);
  assert.match(admin, /resolveAccessRequest/);
  assert.match(admin, /PORTAL_ACCOUNT_REQUIRED/);
  assert.match(admin, /INSERT INTO client_access_grants/);
});

test("Phase 3 preserves separate message reads and explicit client action state", () => {
  const migration = read(
    "migrations/012_create_client_portal_phase_3_operations.sql",
  );
  const clientRepository = read(
    "server/repositories/portal-action-repository.php",
  );
  const adminRepository = read(
    "server/repositories/portal-admin-repository.php",
  );
  assert.match(migration, /client_action_required/);
  assert.match(clientRepository, /read_by_client_at/);
  assert.match(adminRepository, /read_by_admin_at/);
  assert.match(adminRepository, /client_action_required = 1/);
  assert.match(clientRepository, /client_action_required = 0/);
});

test("Phase 3 document replacement keeps submissions and exposes only client guidance", () => {
  const migration = read(
    "migrations/012_create_client_portal_phase_3_operations.sql",
  );
  const repository = read("server/repositories/portal-repository.php");
  const admin = read("server/repositories/portal-admin-repository.php");
  assert.match(migration, /client_visible_review_note/);
  assert.match(repository, /client_visible_review_note/);
  assert.match(admin, /replacement_requested/);
  assert.doesNotMatch(admin, /DELETE FROM document_submissions/);
});

test("Phase 4 stores versioned files outside public paths with content validation", () => {
  const migration = read("migrations/013_create_secure_document_versions.sql");
  const storage = read("server/services/document-storage-service.php");
  assert.match(migration, /version_number INT UNSIGNED/);
  assert.match(
    migration,
    /UNIQUE KEY uq_document_submissions_document_version/,
  );
  assert.match(migration, /archived_at TIMESTAMP/);
  assert.match(storage, /finfo\(FILEINFO_MIME_TYPE\)/);
  assert.match(storage, /is_uploaded_file/);
  assert.match(storage, /random_bytes\(24\)/);
  assert.match(storage, /DIRECTORY_SEPARATOR \. 'v'/);
  assert.doesNotMatch(storage, /public_html|\/public\//);
});

test("Phase 4 client downloads bind both document and session-resolved client", () => {
  const endpoint = read("api/v1/portal/index.php");
  const repository = read("server/repositories/portal-action-repository.php");
  assert.match(endpoint, /sendClientDownload\(\$access, \$sessionUser/);
  assert.match(
    repository,
    /d\.public_id = :document_id AND d\.client_id = :client_id/,
  );
  assert.match(repository, /d\.visibility IN \(\\'client\\', \\'shared\\'\)/);
  assert.match(repository, /ds\.archived_at IS NULL/);
  assert.doesNotMatch(endpoint, /\$_(?:GET|POST|REQUEST)\[['"]client_id['"]\]/);
});

test("Phase 4 Admin downloads and version history remain staff-authorized", () => {
  const endpoint = read("api/v1/portal-admin/index.php");
  const repository = read("server/repositories/portal-admin-repository.php");
  assert.match(endpoint, /alchemize_require_staff_or_admin\(\)/);
  assert.match(endpoint, /sendPrivateFile/);
  assert.match(endpoint, /listDocumentVersions/);
  assert.match(repository, /ORDER BY ds\.version_number DESC/);
});

test("Phase 4 separates client guidance from internal review notes", () => {
  const migration = read("migrations/013_create_secure_document_versions.sql");
  const clientRepository = read("server/repositories/portal-repository.php");
  const adminRepository = read(
    "server/repositories/portal-admin-repository.php",
  );
  assert.match(migration, /internal_review_notes/);
  assert.match(adminRepository, /internal_review_notes/);
  assert.doesNotMatch(clientRepository, /internal_review_notes/);
  assert.match(clientRepository, /client_visible_review_note/);
});
