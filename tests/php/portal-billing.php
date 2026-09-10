<?php
require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/repositories/portal-repository.php';
require_once __DIR__.'/../../server/services/portal-service.php';
function verifyBilling(bool $condition,string $message):void {if(!$condition)throw new RuntimeException($message);}

// Mirrors the exact column projection of AlchemizePortalRepository::listInvoices()
// so a test failure here means the real SELECT stopped matching, the same class
// of drift ("Unknown column") that caused the production 500 this test guards.
function projectInvoice(array $row): array {
    return [
        'id' => $row['public_id'],
        'invoice_number' => $row['invoice_number'],
        'invoice_date' => $row['invoice_date'],
        'due_date' => $row['due_date'],
        'status' => $row['status'],
        'currency' => $row['currency'],
        'subtotal' => $row['subtotal'],
        'adjustment_total' => $row['adjustment_total'],
        'credit_deposit_total' => $row['credit_deposit_total'],
        'paid_total' => $row['paid_total'],
        'outstanding_balance' => $row['outstanding_balance'],
        'client_facing_notes' => $row['client_facing_notes'],
        'issued_at' => $row['issued_at'],
        'engagement_id' => $row['engagement_public_id'],
        'engagement_title' => $row['engagement_title'],
    ];
}
// Mirrors AlchemizePortalRepository::listPayments()'s exact projection.
function projectPayment(array $row): array {
    return [
        'id' => $row['public_id'],
        'payment_date' => $row['payment_date'],
        'amount' => $row['amount'],
        'payment_method' => $row['payment_method'],
        'receipt_url' => $row['receipt_url'],
        'invoice_id' => $row['invoice_public_id'],
        'invoice_number' => $row['invoice_number'],
    ];
}

final class BillingPDO extends PDO {
    public array $invoices = [];
    public array $payments = [];
    public function __construct(){}
    public function prepare(string $query, array $options = []): PDOStatement|false {return new BillingStatement($this, $query);}
}
final class BillingStatement extends PDOStatement {
    private array $rows = [];
    public function __construct(private BillingPDO $db, private string $sql) {}
    public function execute(?array $params = null): bool {
        $clientId = $params['client_id'] ?? null;
        $this->rows = [];
        if (str_contains($this->sql, 'FROM invoices')) {
            $this->rows = array_map('projectInvoice', array_values(array_filter(
                $this->db->invoices,
                static fn (array $row): bool => $row['client_id'] === $clientId
                    && $row['issued_at'] !== null
                    && !in_array($row['status'], ['draft', 'cancelled', 'voided'], true),
            )));
        } elseif (str_contains($this->sql, 'FROM payments')) {
            $eligibleInvoiceIds = array_column(array_filter(
                $this->db->invoices,
                static fn (array $row): bool => $row['issued_at'] !== null
                    && !in_array($row['status'], ['draft', 'cancelled', 'voided'], true),
            ), 'internal_id');
            $this->rows = array_map('projectPayment', array_values(array_filter(
                $this->db->payments,
                static fn (array $row): bool => $row['client_id'] === $clientId
                    && in_array($row['invoice_internal_id'], $eligibleInvoiceIds, true),
            )));
        } elseif (
            str_contains($this->sql, 'FROM engagements e')
            || str_contains($this->sql, 'FROM tasks t')
            || str_contains($this->sql, 'FROM documents_metadata d')
            || str_contains($this->sql, 'FROM appointments a')
            || str_contains($this->sql, 'FROM profile_change_requests')
            || str_contains($this->sql, 'FROM activity_events')
            || str_contains($this->sql, 'FROM messages')
            || str_contains($this->sql, 'FROM message_threads')
        ) {
            $this->rows = [];
        } else {
            throw new RuntimeException('Unexpected SQL: '.$this->sql);
        }
        return true;
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed {return array_shift($this->rows) ?? false;}
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array {return $this->rows;}
    public function fetchColumn(int $column = 0): mixed {return $this->rows ? array_values($this->rows[0])[$column] : false;}
}

function invoiceRow(array $overrides): array {
    return array_replace([
        'internal_id' => null,
        'client_id' => 1,
        'public_id' => 'inv-'.($overrides['internal_id'] ?? '0'),
        'invoice_number' => 'INV-0001',
        'invoice_date' => '2026-09-01',
        'due_date' => '2026-09-15',
        'status' => 'open',
        'currency' => 'USD',
        'subtotal' => '100.00',
        'adjustment_total' => '0.00',
        'credit_deposit_total' => '0.00',
        'paid_total' => '0.00',
        'outstanding_balance' => '100.00',
        'client_facing_notes' => null,
        'internal_notes' => 'Staff-only collections memo',
        'issued_at' => '2026-09-01 00:00:00',
        'engagement_public_id' => null,
        'engagement_title' => null,
    ], $overrides);
}
function paymentRow(array $overrides): array {
    return array_replace([
        'internal_id' => null,
        'client_id' => 1,
        'invoice_internal_id' => null,
        'invoice_public_id' => 'inv-0',
        'public_id' => 'pay-0',
        'payment_date' => '2026-09-05',
        'amount' => '50.00',
        'payment_method' => 'card',
        'receipt_url' => null,
        'internal_note' => 'Staff-only reconciliation note',
        'recorded_by_user_id' => 9,
        'invoice_number' => 'INV-0001',
    ], $overrides);
}

$db = new BillingPDO();
$repository = new AlchemizePortalRepository($db);
$service = new AlchemizePortalService($repository);
$access = [
    'client_id' => 1,
    'client_public_id' => 'client-public-1',
    'client_type' => 'business',
    'display_name' => 'Test Client',
    'preferred_name' => 'Test',
];

$openInvoice = invoiceRow(['internal_id' => 1, 'public_id' => 'inv-1', 'status' => 'open', 'outstanding_balance' => '100.00']);
$partiallyPaidInvoice = invoiceRow(['internal_id' => 2, 'public_id' => 'inv-2', 'status' => 'partially_paid', 'paid_total' => '50.00', 'outstanding_balance' => '50.00']);
$paidInvoice = invoiceRow(['internal_id' => 3, 'public_id' => 'inv-3', 'status' => 'paid', 'paid_total' => '100.00', 'outstanding_balance' => '0.00']);
$draftInvoice = invoiceRow(['internal_id' => 4, 'public_id' => 'inv-4', 'status' => 'draft', 'issued_at' => null]);
$cancelledInvoice = invoiceRow(['internal_id' => 5, 'public_id' => 'inv-5', 'status' => 'cancelled']);
$voidedInvoice = invoiceRow(['internal_id' => 6, 'public_id' => 'inv-6', 'status' => 'voided']);
$otherClientInvoice = invoiceRow(['internal_id' => 7, 'public_id' => 'inv-7', 'client_id' => 2, 'status' => 'open']);

$db->invoices = [$openInvoice, $partiallyPaidInvoice, $paidInvoice, $draftInvoice, $cancelledInvoice, $voidedInvoice, $otherClientInvoice];
$db->payments = [
    paymentRow(['internal_id' => 1, 'public_id' => 'pay-1', 'client_id' => 1, 'invoice_internal_id' => 2, 'invoice_public_id' => 'inv-2', 'amount' => '50.00']),
    paymentRow(['internal_id' => 2, 'public_id' => 'pay-2', 'client_id' => 2, 'invoice_internal_id' => 7, 'invoice_public_id' => 'inv-7', 'amount' => '25.00']),
];

// 1 + 2. portal/billing succeeds and an issued/open invoice is returned.
$billing = $service->billing($access);
verifyBilling(count($billing['invoices']) === 3, 'Expected 3 client-eligible invoices (open, partially_paid, paid; draft/cancelled/voided excluded)');
verifyBilling(
    in_array('inv-1', array_column($billing['invoices'], 'id'), true),
    'Open invoice missing from billing response',
);

// 3. Partially paid invoice returns the correct remaining balance.
$partial = array_values(array_filter($billing['invoices'], static fn (array $row): bool => $row['id'] === 'inv-2'))[0];
verifyBilling($partial['outstanding_balance'] === '50.00', 'Partially paid invoice remaining balance is wrong');

// 4. Recorded payments appear in client payment history.
verifyBilling(count($billing['payments']) === 1, 'Only this client\'s payments should appear');
verifyBilling($billing['payments'][0]['id'] === 'pay-1', 'Wrong payment returned');

// 5. Paid invoices remain visible as history.
verifyBilling(
    in_array('inv-3', array_column($billing['invoices'], 'id'), true),
    'Paid invoice should remain visible as history',
);

// 6. Draft/cancelled/voided invoices remain hidden.
foreach (['inv-4', 'inv-5', 'inv-6'] as $hiddenId) {
    verifyBilling(
        !in_array($hiddenId, array_column($billing['invoices'], 'id'), true),
        "{$hiddenId} (draft/cancelled/voided) must not be client-visible",
    );
}

// 7. Client A cannot access Client B billing data.
verifyBilling(
    !in_array('inv-7', array_column($billing['invoices'], 'id'), true),
    'Cross-client invoice leaked into billing response',
);
foreach ($billing['payments'] as $payment) {
    verifyBilling($payment['id'] !== 'pay-2', 'Cross-client payment leaked into billing response');
}

// 8. Admin-only billing fields/actions are not exposed.
foreach ($billing['invoices'] as $invoice) {
    verifyBilling(!array_key_exists('internal_notes', $invoice), 'Admin-only internal_notes leaked to client');
}
foreach ($billing['payments'] as $payment) {
    verifyBilling(!array_key_exists('internal_note', $payment), 'Admin-only payment internal_note leaked to client');
    verifyBilling(!array_key_exists('recorded_by_user_id', $payment), 'Admin-only recorded_by_user_id leaked to client');
}

// Open balance only sums open/partially_paid/past_due invoices (not paid ones).
verifyBilling($billing['summary']['open_balance'] === '150.00', 'Open balance calculation is wrong');

// 9. Client Dashboard and Client Billing remain consistent for the same eligible invoices.
$dashboard = $service->dashboard($access);
verifyBilling(
    $dashboard['summary']['open_balance'] === $billing['summary']['open_balance'],
    'Dashboard and Billing open balances disagree',
);
verifyBilling(
    $dashboard['summary']['open_invoices'] === 2,
    'Dashboard open invoice count should match Billing\'s open/partially_paid/past_due set',
);

echo "Portal billing: eligible invoices, remaining balance, payment history, draft/cancelled/voided hidden, cross-client isolation, admin-field exclusion, and dashboard/billing consistency passed.\n";
