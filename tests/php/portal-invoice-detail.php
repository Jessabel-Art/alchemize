<?php
require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/repositories/portal-repository.php';
require_once __DIR__.'/../../server/services/portal-service.php';
function verifyInvoiceDetail(bool $condition,string $message):void {if(!$condition)throw new RuntimeException($message);}

final class InvoiceDetailPDO extends PDO {
    public array $invoices = [];
    public array $lineItems = [];
    public array $payments = [];
    public function __construct(){}
    public function prepare(string $query, array $options = []): PDOStatement|false {return new InvoiceDetailStatement($this, $query);}
}
final class InvoiceDetailStatement extends PDOStatement {
    private array $rows = [];
    private bool $single = false;
    public function __construct(private InvoiceDetailPDO $db, private string $sql) {}
    public function execute(?array $params = null): bool {
        $clientId = $params['client_id'] ?? null;
        $this->rows = [];
        $this->single = false;
        if (str_contains($this->sql, 'FROM invoices')) {
            $this->single = true;
            $match = array_values(array_filter(
                $this->db->invoices,
                static fn (array $row): bool => $row['client_id'] === $clientId
                    && $row['public_id'] === ($params['invoice_id'] ?? null)
                    && $row['issued_at'] !== null
                    && !in_array($row['status'], ['draft', 'cancelled', 'voided'], true),
            ));
            $this->rows = $match ? [[
                'internal_id' => $match[0]['internal_id'],
                'id' => $match[0]['public_id'],
                'invoice_number' => $match[0]['invoice_number'],
                'invoice_date' => $match[0]['invoice_date'],
                'due_date' => $match[0]['due_date'],
                'status' => $match[0]['status'],
                'currency' => $match[0]['currency'],
                'subtotal' => $match[0]['subtotal'],
                'adjustment_total' => $match[0]['adjustment_total'],
                'credit_deposit_total' => $match[0]['credit_deposit_total'],
                'paid_total' => $match[0]['paid_total'],
                'outstanding_balance' => $match[0]['outstanding_balance'],
                'client_facing_notes' => $match[0]['client_facing_notes'],
                'issued_at' => $match[0]['issued_at'],
                'engagement_id' => null,
                'engagement_title' => null,
                'client_display_name' => $match[0]['client_display_name'],
                'client_email' => $match[0]['client_email'],
                'client_phone' => $match[0]['client_phone'],
                // Deliberately absent from the projection: admin-only
                // columns like internal_notes must never be selectable
                // here, so there is nothing for this mock to leak either.
            ]] : [];
        } elseif (str_contains($this->sql, 'FROM invoice_line_items')) {
            $this->rows = array_map(
                static fn (array $row): array => [
                    'id' => $row['id'],
                    'description' => $row['description_snapshot'],
                    'quantity' => $row['quantity'],
                    'unit_price' => $row['unit_price'],
                    'amount' => $row['amount'],
                ],
                array_values(array_filter(
                    $this->db->lineItems,
                    static fn (array $row): bool => $row['invoice_id'] === ($params['invoice_id'] ?? null),
                )),
            );
        } elseif (str_contains($this->sql, 'FROM payments')) {
            $this->rows = array_map(
                static fn (array $row): array => [
                    'id' => $row['id'],
                    'payment_date' => $row['payment_date'],
                    'amount' => $row['amount'],
                    'payment_method' => $row['payment_method'],
                    'receipt_url' => $row['receipt_url'],
                ],
                array_values(array_filter(
                    $this->db->payments,
                    static fn (array $row): bool => $row['invoice_id'] === ($params['invoice_id'] ?? null)
                        && $row['client_id'] === $clientId,
                )),
            );
        } else {
            throw new RuntimeException('Unexpected SQL: '.$this->sql);
        }
        return true;
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed {return array_shift($this->rows) ?? false;}
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array {return $this->rows;}
}

$db = new InvoiceDetailPDO();
$repository = new AlchemizePortalRepository($db);
$service = new AlchemizePortalService($repository);

$db->invoices = [
    [
        'internal_id' => 501, 'public_id' => 'inv-own', 'client_id' => 1,
        'invoice_number' => 'INV-OWN-0001', 'invoice_date' => '2026-09-01', 'due_date' => '2026-09-15',
        'status' => 'partially_paid', 'currency' => 'USD', 'subtotal' => '199.00', 'adjustment_total' => '0.00',
        'credit_deposit_total' => '0.00', 'paid_total' => '20.00', 'outstanding_balance' => '179.00',
        'client_facing_notes' => 'Thanks for your business.', 'issued_at' => '2026-09-01 00:00:00',
        'client_display_name' => 'Own Client', 'client_email' => 'own@example.com', 'client_phone' => '555-0100',
    ],
    [
        'internal_id' => 502, 'public_id' => 'inv-other', 'client_id' => 2,
        'invoice_number' => 'INV-OTHER-0001', 'invoice_date' => '2026-09-01', 'due_date' => '2026-09-15',
        'status' => 'open', 'currency' => 'USD', 'subtotal' => '50.00', 'adjustment_total' => '0.00',
        'credit_deposit_total' => '0.00', 'paid_total' => '0.00', 'outstanding_balance' => '50.00',
        'client_facing_notes' => null, 'issued_at' => '2026-09-01 00:00:00',
        'client_display_name' => 'Other Client', 'client_email' => 'other@example.com', 'client_phone' => null,
    ],
    [
        'internal_id' => 503, 'public_id' => 'inv-draft', 'client_id' => 1,
        'invoice_number' => 'INV-DRAFT-0001', 'invoice_date' => '2026-09-01', 'due_date' => '2026-09-15',
        'status' => 'draft', 'currency' => 'USD', 'subtotal' => '10.00', 'adjustment_total' => '0.00',
        'credit_deposit_total' => '0.00', 'paid_total' => '0.00', 'outstanding_balance' => '10.00',
        'client_facing_notes' => null, 'issued_at' => null,
        'client_display_name' => 'Own Client', 'client_email' => 'own@example.com', 'client_phone' => null,
    ],
];
$db->lineItems = [
    ['id' => 'li-1', 'invoice_id' => 501, 'description_snapshot' => 'Consulting hour', 'quantity' => '2.00', 'unit_price' => '50.00', 'amount' => '100.00'],
    ['id' => 'li-2', 'invoice_id' => 501, 'description_snapshot' => 'Filing fee', 'quantity' => '1.00', 'unit_price' => '99.00', 'amount' => '99.00'],
];
$db->payments = [
    ['id' => 'pay-1', 'invoice_id' => 501, 'client_id' => 1, 'payment_date' => '2026-09-05', 'amount' => '20.00', 'payment_method' => 'cash', 'receipt_url' => null],
    ['id' => 'pay-2', 'invoice_id' => 502, 'client_id' => 2, 'payment_date' => '2026-09-05', 'amount' => '10.00', 'payment_method' => 'card', 'receipt_url' => null],
];

// Owner can fetch their own invoice detail with line items and payments.
$detail = $service->invoiceDetail(['client_id' => 1], 'inv-own');
verifyInvoiceDetail($detail['invoice']['id'] === 'inv-own', 'Wrong invoice returned');
verifyInvoiceDetail(count($detail['invoice']['line_items']) === 2, 'Line items missing');
verifyInvoiceDetail($detail['invoice']['line_items'][0]['description'] === 'Consulting hour', 'Line item description wrong');
verifyInvoiceDetail($detail['invoice']['line_items'][0]['amount'] === '100.00', 'Line item amount wrong');
verifyInvoiceDetail(count($detail['invoice']['payments']) === 1, 'Payments missing');
verifyInvoiceDetail($detail['invoice']['payments'][0]['id'] === 'pay-1', 'Wrong payment returned');

// Totals/balance match the authoritative stored columns, not a
// recalculation that could drift from what Admin/Billing already show.
verifyInvoiceDetail($detail['invoice']['outstanding_balance'] === '179.00', 'Balance does not match stored value');
verifyInvoiceDetail($detail['invoice']['subtotal'] === '199.00', 'Subtotal does not match stored value');

// Admin-only fields are structurally absent (never selected), not merely
// filtered after the fact.
verifyInvoiceDetail(!array_key_exists('internal_notes', $detail['invoice']), 'internal_notes leaked to client');
verifyInvoiceDetail(!array_key_exists('internal_id', $detail['invoice']), 'internal numeric id leaked to client');

// A client cannot access another client's invoice.
try {
    $service->invoiceDetail(['client_id' => 1], 'inv-other');
    verifyInvoiceDetail(false, 'Cross-client invoice access was not rejected');
} catch (AlchemizeRequestException $error) {
    verifyInvoiceDetail($error->httpStatus === 404, 'Expected 404 for cross-client invoice access');
}

// Draft (unissued) invoices remain hidden, same rule as the Billing list.
try {
    $service->invoiceDetail(['client_id' => 1], 'inv-draft');
    verifyInvoiceDetail(false, 'Draft invoice was not rejected');
} catch (AlchemizeRequestException $error) {
    verifyInvoiceDetail($error->httpStatus === 404, 'Expected 404 for a draft invoice');
}

// Unknown invoice id.
try {
    $service->invoiceDetail(['client_id' => 1], 'inv-does-not-exist');
    verifyInvoiceDetail(false, 'Unknown invoice id was not rejected');
} catch (AlchemizeRequestException $error) {
    verifyInvoiceDetail($error->httpStatus === 404, 'Expected 404 for an unknown invoice id');
}

echo "Portal invoice detail: line items, payments, authoritative totals, admin-field exclusion, cross-client isolation, and draft-hiding passed.\n";
