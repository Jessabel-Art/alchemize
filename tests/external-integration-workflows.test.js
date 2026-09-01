import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("integration migration persists provider identifiers and safe sync state", () => {
  const sql = read(
    "migrations/021_add_external_integration_workflow_state.sql",
  );
  for (const field of [
    "google_drive_folder_id",
    "google_drive_file_id",
    "google_calendar_event_id",
    "stripe_customer_id",
    "stripe_checkout_session_id",
    "stripe_payment_intent_id",
    "delivery_status",
  ])
    assert.match(sql, new RegExp(field));
  assert.doesNotMatch(sql, /secret|password|private_key/i);
});

test("Drive client folders and files are reused by stable application identifiers", () => {
  const drive = read("server/services/google-drive-service.php");
  const workflow = read("server/services/external-integration-service.php");
  assert.match(drive, /alchemizeClientId/);
  assert.match(drive, /alchemizeSubmissionId/);
  assert.match(workflow, /google_drive_folder_id/);
  assert.match(workflow, /google_drive_file_id/);
  assert.match(
    workflow,
    /catch \(Throwable \$error\)[\s\S]*setDocumentDriveState/s,
  );
});

test("document synchronization follows committed local version persistence", () => {
  const actions = read("server/services/portal-action-service.php");
  assert.match(actions, /\$database->commit\(\);[\s\S]*synchronizeDocument/s);
  assert.match(actions, /nextDocumentVersion/);
  assert.match(actions, /drive_sync_status/);
});

test("Calendar uses one deterministic event and updates or cancels it", () => {
  const calendar = read("server/services/google-calendar-service.php");
  const appointmentApi = read("api/v1/appointments/index.php");
  assert.match(calendar, /google_calendar_event_id/);
  assert.match(calendar, /events->update/);
  assert.match(calendar, /events->delete/);
  assert.match(calendar, /hash\('sha256'/);
  assert.match(appointmentApi, /synchronizeAppointment/);
});

test("notification delivery state records actual provider outcome", () => {
  const service = read("server/services/notification-service.php");
  const repository = read("server/repositories/notification-repository.php");
  const resend = read("server/services/resend-email-provider.php");
  assert.match(service, /deliver\(/);
  assert.match(service, /recordDelivery/);
  assert.match(repository, /delivery_status/);
  assert.match(resend, /api\.resend\.com\/emails/);
  assert.match(resend, /Authorization: Bearer/);
  assert.doesNotMatch(resend, /SMTPDebug|SMTPAuth|PHPMailer/);
});

test("lead persistence precedes best-effort Admin notification with abuse guards", () => {
  const service = read("server/services/lead-service.php");
  const endpoint = read("api/v1/leads/index.php");
  assert.ok(
    service.indexOf("$this->database->commit()") <
      service.indexOf("notifyStaff("),
  );
  assert.match(service, /registerPublicSubmission/);
  assert.match(service, /RATE_LIMITED/);
  assert.match(service, /duplicate/);
  assert.match(endpoint, /REMOTE_ADDR/);
  assert.match(service, /42S02/);
  assert.match(service, /1146/);
  assert.match(service, /Contact lead guard unavailable/);
  assert.ok(
    service.indexOf("$this->database->commit()") <
      service.indexOf("Lead notification bookkeeping failed"),
  );
});

test("Stripe Checkout is hosted, client scoped, and cannot locally mark paid", () => {
  const service = read("server/services/stripe-payment-service.php");
  const endpoint = read("api/v1/portal/index.php");
  assert.match(service, /\/v1\/checkout\/sessions/);
  assert.match(service, /invoiceForClient\(\$invoicePublicId, \$clientId\)/);
  assert.match(service, /mode' => 'payment'/);
  assert.doesNotMatch(service, /status'\s*=>\s*'paid'/);
  assert.match(endpoint, /alchemize_require_csrf\(\)/);
  assert.match(endpoint, /\(int\) \$access\['client_id'\]/);
});

test("verified Stripe webhooks reconcile idempotently", () => {
  const endpoint = read("api/v1/webhooks/index.php");
  const repository = read(
    "server/repositories/external-integration-repository.php",
  );
  assert.match(endpoint, /alchemize_stripe_verify_signed_payload/);
  assert.match(endpoint, /status' => 'duplicate'/);
  assert.match(endpoint, /reconcileCheckoutSession/);
  assert.match(
    repository,
    /SELECT id FROM payments WHERE stripe_payment_intent_id/,
  );
  assert.match(repository, /ON DUPLICATE KEY UPDATE/);
});

test("client files remain behind authenticated scoped application downloads", () => {
  const endpoint = read("api/v1/portal/index.php");
  const repository = read("server/repositories/portal-action-repository.php");
  assert.match(endpoint, /alchemize_require_authenticated_user/);
  assert.match(endpoint, /sendClientDownload\(\$access/);
  assert.match(repository, /d\.client_id = :client_id/);
  assert.doesNotMatch(
    read("server/repositories/portal-repository.php"),
    /drive\.google\.com/,
  );
});
