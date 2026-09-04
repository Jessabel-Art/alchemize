import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const adminPage = read("src/pages/admin/AdminOperationalPages.jsx");
const adminCss = read("src/pages/admin/admin.css");
const paymentRepository = read("server/repositories/payment-repository.php");
const invoiceRepository = read("server/repositories/invoice-repository.php");
const portalService = read("server/services/portal-service.php");

test("create invoice requires an intentional client selection instead of silently preselecting a client", () => {
  assert.match(adminPage, /clientId:\s*""/);
  assert.doesNotMatch(adminPage, /clientId:\s*snapshot\.clients\[0\]\?\.id/);
});

test("client selection keeps canonical client ids and filters engagements to the selected client", () => {
  assert.match(adminPage, /handleClientSelection\s*\(/);
  assert.match(
    adminPage,
    /client\.displayName\.toLowerCase\(\)\.includes\(trimmed\.toLowerCase\(\)\)/,
  );
  assert.match(
    adminPage,
    /engagementOptions.*filter\(\s*\(engagement\) => engagement\.clientId === invoiceDraft\.clientId/,
  );
  assert.match(adminPage, /engagementId:\s*""/);
});

test("invoice line items use a proper columns-based grid with quantity rate amount math", () => {
  assert.match(adminPage, /DESCRIPTION/i);
  assert.match(adminPage, /QTY/i);
  assert.match(adminPage, /RATE/i);
  assert.match(adminPage, /AMOUNT/i);
  assert.match(adminPage, /TYPE/i);
  assert.match(adminPage, /ACTION/i);
  assert.match(adminPage, /nextLine\.amount\s*=\s*quantity\s*\*\s*unitPrice/);
});

test("screen mode hides the print-only invoice markup while print mode reveals the branded invoice", () => {
  assert.match(adminCss, /\.invoice-print-sheet\s*\{\s*display:\s*none/);
  assert.match(
    adminCss,
    /@media print[\s\S]*\.invoice-print-sheet\s*\{\s*display:\s*block/,
  );
  assert.match(adminCss, /Alchemize Business Services/);
});

test("print/export includes the required branded invoice sections and excludes internal memo from the print view", () => {
  assert.match(adminPage, /invoice-print-sheet/);
  assert.match(adminPage, /Invoice date:/);
  assert.match(adminPage, /Due date:/);
  assert.match(adminPage, /Terms:/);
  assert.match(adminPage, /Remaining balance/);
  assert.doesNotMatch(adminPage, /<h3>Internal memo<\/h3>/i);
});

test("payment recording remains canonical and keeps the payment ledger reconciled", () => {
  assert.match(adminPage, /await paymentApi\.create\(/);
  assert.match(adminPage, /adminStore\.recordPayment\(/);
  assert.match(paymentRepository, /request_key/);
  assert.match(paymentRepository, /outstanding_balance/);
});

test("partial and full payment behavior match the invoice balance rules", () => {
  assert.match(
    paymentRepository,
    /GREATEST\(0, outstanding_balance - :amount2\)/,
  );
  assert.match(
    paymentRepository,
    /status = IF\(outstanding_balance - :amount3 <= 0, 'paid', 'partially_paid'\)/,
  );
  assert.match(invoiceRepository, /outstanding_balance/);
  assert.match(invoiceRepository, /paid_total/);
});

test("client portal balance is driven from filled invoice totals and not internal memo fields", () => {
  assert.match(portalService, /outstanding_balance/);
  assert.doesNotMatch(portalService, /internal_notes/i);
});
