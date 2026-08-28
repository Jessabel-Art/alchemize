import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("internal admin sessions stay usable after login and only client roles are portal-access gated", () => {
  const session = read("server/auth/session.php");
  const users = read("server/repositories/user-repository.php");
  assert.match(session, /alchemize_validated_session_user/);
  assert.match(session, /alchemize_session_user\(\)/);
  assert.match(session, /owner-admin|administrator|staff|read-only/);
  assert.match(session, /if \(\$isInternalRole\)/);
  assert.match(session, /return \$sessionUser;/);
  assert.match(session, /status.*active/s);
  assert.match(session, /hasActiveClientAccess/);
  assert.match(users, /cag\.status = 'active'/);
  assert.match(users, /c\.portal_status = 'active'/);
});

test("lead conversion locks inside its transaction and has schema-backed linkage", () => {
  const service = read("server/services/lead-admin-service.php");
  const migration = read("migrations/022_close_lifecycle_contract_gaps.sql");
  assert.ok(
    service.indexOf("beginTransaction()") <
      service.indexOf("findByIdForUpdate"),
  );
  assert.match(service, /LEAD_ALREADY_CONVERTED/);
  assert.match(migration, /ALTER TABLE leads[\s\S]*ADD COLUMN client_id/);
  assert.match(migration, /UNIQUE KEY uq_leads_client_id/);
});

test("issued invoices persist line items and become client visible", () => {
  const endpoint = read("api/v1/invoices/index.php");
  const repository = read("server/repositories/invoice-repository.php");
  const frontend = read("src/pages/admin/AdminOperationalPages.jsx");
  assert.match(endpoint, /createWithLineItems/);
  assert.match(endpoint, /\$status === 'draft' \? null : date/);
  assert.match(repository, /INSERT INTO invoice_line_items/);
  assert.match(frontend, /line_items: resolvedLines/);
});

test("manual payment is persisted, idempotent, and reconciles the invoice", () => {
  const endpoint = read("api/v1/payments/index.php");
  const repository = read("server/repositories/payment-repository.php");
  const frontend = read("src/pages/admin/AdminOperationalPages.jsx");
  assert.match(endpoint, /recordManualPayment/);
  assert.match(endpoint, /\(int\) \$actor\['user_id'\]/);
  assert.match(repository, /FOR UPDATE/);
  assert.match(repository, /outstanding_balance/);
  assert.match(repository, /request_key/);
  assert.ok(
    frontend.indexOf("await paymentApi.create") <
      frontend.indexOf("adminStore.recordPayment"),
  );
});

test("Admin billing reloads invoices and payments from persistent APIs", () => {
  const layout = read("src/layouts/AdminLayout.jsx");
  const api = read("src/services/admin-api.js");
  assert.match(layout, /invoices\.list\(\)/);
  assert.match(layout, /payments\.list\(\)/);
  assert.match(layout, /invoices: \(invoiceRows/);
  assert.match(layout, /payments: \(paymentRows/);
  assert.match(api, /export const payments = {[\s\S]*list:/);
});

test("production schema verification is CLI-only and status-only", () => {
  const diagnostic = read("scripts/verify-production-schema.php");
  assert.match(diagnostic, /PHP_SAPI !== 'cli'/);
  assert.match(diagnostic, /PRESENT/);
  assert.match(diagnostic, /MISSING/);
  assert.match(diagnostic, /MISMATCH/);
  assert.doesNotMatch(diagnostic, /echo.*password/i);
});
