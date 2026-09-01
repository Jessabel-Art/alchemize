import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("migrations/015_create_communication_notifications.sql");
const clientRepository = read(
  "server/repositories/portal-action-repository.php",
);
const clientService = read("server/services/portal-action-service.php");
const adminRepository = read("server/repositories/portal-admin-repository.php");
const adminService = read("server/services/portal-admin-service.php");
const adminApi = read("api/v1/portal-admin/index.php");
const notificationRepository = read(
  "server/repositories/notification-repository.php",
);
const notificationService = read("server/services/notification-service.php");
const resendProvider = read("server/services/resend-email-provider.php");

test("extends the existing message system with operational states and relationships", () => {
  assert.match(migration, /waiting_on_client/);
  assert.match(migration, /waiting_on_alchemize/);
  assert.match(migration, /resolved/);
  for (const relation of [
    "service",
    "engagement",
    "task",
    "document",
    "appointment",
    "invoice",
  ]) {
    assert.match(migration, new RegExp(`fk_message_threads_${relation}`));
  }
  assert.match(migration, /edited_at/);
  assert.match(migration, /archived_at/);
});

test("keeps client and Admin read states independent", () => {
  assert.match(
    clientRepository,
    /sender_type[\s\S]*staff[\s\S]*read_by_client_at IS NULL/,
  );
  assert.match(
    adminRepository,
    /sender_type[\s\S]*client[\s\S]*read_by_admin_at IS NULL/,
  );
  assert.doesNotMatch(clientRepository, /SET read_by_admin_at/);
});

test("binds client thread access to the session-resolved client", () => {
  assert.match(
    clientRepository,
    /public_id = :public_id AND client_id = :client_id/,
  );
  assert.match(clientService, /\$access\['client_id'\]/);
  assert.match(clientService, /relatedEntityBelongsToClient/);
});

test("controls Admin conversation routes and records client-visible activity", () => {
  assert.match(adminApi, /alchemize_require_staff_or_admin/);
  assert.match(adminApi, /alchemize_require_csrf/);
  assert.match(adminService, /admin\.message\.sent/);
  assert.match(adminService, /admin\.message\.resolved/);
  assert.match(clientService, /client\.message\.sent/);
});

test("creates deduplicated internal notifications behind an email provider boundary", () => {
  assert.match(migration, /CREATE TABLE notifications/);
  assert.match(migration, /uq_notifications_recipient_dedupe/);
  assert.match(notificationRepository, /INSERT IGNORE INTO notifications/);
  assert.match(notificationService, /interface AlchemizeEmailProvider/);
  assert.match(notificationService, /AlchemizeNullEmailProvider/);
  assert.doesNotMatch(notificationService, /smtp|sendgrid|mailgun|amazon ses/i);
});

test("configures Resend through the existing provider boundary without raw SMTP", () => {
  assert.match(resendProvider, /implements AlchemizeEmailProvider/);
  assert.match(resendProvider, /api\.resend\.com\/emails|Authorization: Bearer/);
  assert.match(resendProvider, /reply_to/);
  assert.doesNotMatch(resendProvider, /PHPMailer|SMTPAuth|ENCRYPTION_STARTTLS|fsockopen|stream_socket_client/);
});
