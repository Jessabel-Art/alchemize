<?php
// Focused coverage for the Client Billing "Pay with PayPal" wiring:
// AlchemizePaypalPaymentService (order creation + capture) backed by a
// stateful mock PDO (real AlchemizeExternalIntegrationRepository SQL,
// in-memory rows) and a recording AlchemizePaypalGateway double, so the
// actual balance/ownership/idempotency logic is exercised without a
// network call to PayPal.
declare(strict_types=1);

require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/http/response.php';
require_once __DIR__.'/../../server/repositories/external-integration-repository.php';
require_once __DIR__.'/../../server/services/paypal-payment-service.php';

function alchemize_uuid_v4(): string { static $n = 0; $n++; return 'pay-uuid-'.$n; }
function verifyPaypal(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function rejectsPaypal(callable $operation, string $code): void {
    try { $operation(); } catch (AlchemizeRequestException $error) {
        verifyPaypal($error->errorCode === $code, "Expected {$code}, got {$error->errorCode}: {$error->getMessage()}");
        return;
    }
    throw new RuntimeException("Expected {$code} but no exception was thrown");
}

final class PaypalTestPDO extends PDO {
    public array $invoices = [];
    public array $payments = [];
    public function __construct() {}
    public function prepare(string $query, array $options = []): PDOStatement|false {
        return new PaypalTestStatement($this, $query);
    }
}

final class PaypalTestStatement extends PDOStatement {
    private array $rows = [];
    public function __construct(private PaypalTestPDO $db, private string $sql) {}

    public function execute(?array $params = null): bool {
        $sql = $this->sql;
        $params ??= [];

        if (str_contains($sql, 'FROM invoices i INNER JOIN clients')) {
            $matches = array_values(array_filter($this->db->invoices, static function (array $row) use ($params): bool {
                return $row['public_id'] === $params['public_id']
                    && $row['client_id'] === $params['client_id']
                    && $row['issued_at'] !== null
                    && in_array($row['status'], ['open', 'partially_paid', 'past_due'], true)
                    && (float) $row['outstanding_balance'] > 0;
            }));
            $this->rows = $matches;
            return true;
        }

        if (str_starts_with(trim($sql), 'UPDATE invoices SET paypal_order_id')) {
            foreach ($this->db->invoices as &$row) {
                if ($row['id'] === $params['id']) {
                    $row['paypal_order_id'] = $params['order_id'];
                }
            }
            unset($row);
            return true;
        }

        if (str_contains($sql, 'FROM invoices WHERE paypal_order_id')) {
            $matches = array_values(array_filter($this->db->invoices, static function (array $row) use ($params): bool {
                return ($row['paypal_order_id'] ?? null) === $params['id'];
            }));
            $this->rows = $matches;
            return true;
        }

        if (str_contains($sql, 'SELECT id FROM payments WHERE paypal_capture_id')) {
            $matches = array_values(array_filter($this->db->payments, static function (array $row) use ($params): bool {
                return ($row['paypal_capture_id'] ?? null) === $params['id'];
            }));
            $this->rows = $matches;
            return true;
        }

        if (str_starts_with(trim($sql), 'INSERT INTO payments')) {
            $this->db->payments[] = [
                'id' => count($this->db->payments) + 1,
                'public_id' => $params['public_id'],
                'invoice_id' => $params['invoice_id'],
                'client_id' => $params['client_id'],
                'amount' => $params['amount'],
                'payment_method' => 'paypal',
                'external_reference' => $params['reference'],
                'paypal_capture_id' => $params['capture'],
            ];
            return true;
        }

        if (str_starts_with(trim($sql), 'UPDATE invoices SET paid_total')) {
            foreach ($this->db->invoices as &$row) {
                if ($row['id'] === $params['id']) {
                    $amount = (float) $params['amount'];
                    $cap = (float) $row['subtotal'] + (float) $row['adjustment_total'] - (float) $row['credit_deposit_total'];
                    $newPaid = min($cap, (float) $row['paid_total'] + $amount);
                    $newOutstanding = max(0.0, (float) $row['outstanding_balance'] - $amount);
                    $row['paid_total'] = number_format($newPaid, 2, '.', '');
                    $row['outstanding_balance'] = number_format($newOutstanding, 2, '.', '');
                    $row['status'] = $newOutstanding <= 0 ? 'paid' : 'partially_paid';
                }
            }
            unset($row);
            return true;
        }

        throw new RuntimeException('Unexpected SQL: '.$sql);
    }

    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed {
        return array_shift($this->rows) ?? false;
    }
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array { return $this->rows; }
    public function fetchColumn(int $column = 0): mixed { return false; }
}

final class RecordingPaypalGateway implements AlchemizePaypalGateway {
    public array $createOrderCalls = [];
    public array $captureOrderCalls = [];
    public mixed $createOrderResponse = null;
    public mixed $captureOrderResponse = null;

    public function createOrder(array $payload): array {
        $this->createOrderCalls[] = $payload;
        if ($this->createOrderResponse instanceof Throwable) throw $this->createOrderResponse;
        return $this->createOrderResponse;
    }
    public function captureOrder(string $orderId): array {
        $this->captureOrderCalls[] = $orderId;
        if ($this->captureOrderResponse instanceof Throwable) throw $this->captureOrderResponse;
        return $this->captureOrderResponse;
    }
}

function paypalInvoiceRow(array $overrides): array {
    return array_replace([
        'id' => 1,
        'public_id' => 'inv-1',
        'client_id' => 1,
        'invoice_number' => 'INV-0001',
        'currency' => 'USD',
        'subtotal' => '100.00',
        'adjustment_total' => '0.00',
        'credit_deposit_total' => '0.00',
        'paid_total' => '0.00',
        'outstanding_balance' => '100.00',
        'status' => 'open',
        'issued_at' => '2026-09-01 00:00:00',
        'paypal_order_id' => null,
    ], $overrides);
}

function captureResponse(string $captureId, string $value, string $currency = 'USD'): array {
    return [
        'purchase_units' => [[
            'payments' => ['captures' => [[
                'id' => $captureId,
                'status' => 'COMPLETED',
                'amount' => ['value' => $value, 'currency_code' => $currency],
            ]]],
        ]],
    ];
}

// 1. Authenticated client can create a PayPal order for their own invoice,
// and the order amount sent to PayPal is the authoritative remaining
// balance (not the original invoice total).
$db = new PaypalTestPDO();
$db->invoices = [paypalInvoiceRow(['id' => 1, 'public_id' => 'inv-1', 'client_id' => 1, 'subtotal' => '199.00', 'paid_total' => '20.00', 'outstanding_balance' => '179.00', 'status' => 'partially_paid'])];
$repository = new AlchemizeExternalIntegrationRepository($db);
$gateway = new RecordingPaypalGateway();
$gateway->createOrderResponse = ['id' => 'ORDER-1', 'status' => 'CREATED'];
$service = new AlchemizePaypalPaymentService($repository, $gateway);

$order = $service->createOrder(1, 'inv-1');
verifyPaypal($order['order_id'] === 'ORDER-1', 'createOrder should return the gateway order id');
verifyPaypal(count($gateway->createOrderCalls) === 1, 'Expected exactly one PayPal order-creation call');
verifyPaypal(
    $gateway->createOrderCalls[0]['purchase_units'][0]['amount']['value'] === '179.00',
    'PayPal order must use the authoritative remaining balance, not the original invoice total'
);
verifyPaypal($db->invoices[0]['paypal_order_id'] === 'ORDER-1', 'Invoice should be stamped with the PayPal order id');

// 2. A client cannot create a PayPal order for another client's invoice.
rejectsPaypal(fn () => $service->createOrder(2, 'inv-1'), 'NOT_FOUND');
verifyPaypal(count($gateway->createOrderCalls) === 1, 'Cross-client order creation must not reach the PayPal gateway');

// 3. An invoice with no outstanding balance cannot start a PayPal checkout.
$dbPaid = new PaypalTestPDO();
$dbPaid->invoices = [paypalInvoiceRow(['id' => 2, 'public_id' => 'inv-2', 'client_id' => 1, 'outstanding_balance' => '0.00', 'status' => 'paid'])];
$servicePaid = new AlchemizePaypalPaymentService(new AlchemizeExternalIntegrationRepository($dbPaid), new RecordingPaypalGateway());
rejectsPaypal(fn () => $servicePaid->createOrder(1, 'inv-2'), 'NOT_FOUND');

// 4. Successful capture records a payment and updates the invoice's
// paid_total/outstanding_balance/status through the same authoritative
// logic used elsewhere, and rejects an order id that doesn't match the
// invoice the client is trying to pay.
$gateway->captureOrderResponse = captureResponse('CAPTURE-1', '179.00');
rejectsPaypal(fn () => $service->captureOrder(1, 'inv-1', 'ORDER-WRONG'), 'PAYPAL_ORDER_MISMATCH');
verifyPaypal(count($gateway->captureOrderCalls) === 0, 'A mismatched order id must never reach the PayPal capture call');

$capture = $service->captureOrder(1, 'inv-1', 'ORDER-1');
verifyPaypal($capture['status'] === 'completed', 'Capture should report completed status');
verifyPaypal(count($db->payments) === 1, 'Expected exactly one payment recorded');
verifyPaypal($db->payments[0]['payment_method'] === 'paypal', 'Payment method should be paypal');
verifyPaypal($db->payments[0]['amount'] === '179.00', 'Recorded payment amount should equal the captured amount');
verifyPaypal($db->invoices[0]['outstanding_balance'] === '0.00', 'Invoice outstanding balance should be fully cleared');
verifyPaypal($db->invoices[0]['status'] === 'paid', 'Invoice should become paid once the full balance is captured');
verifyPaypal($db->invoices[0]['paid_total'] === '199.00', 'Invoice paid_total should include the prior partial payment plus this capture');

// 5. A second capture attempt for the now-fully-paid invoice (e.g. a
// duplicate webhook or a retried client confirmation) is rejected rather
// than recording a second payment.
rejectsPaypal(fn () => $service->captureOrder(1, 'inv-1', 'ORDER-1'), 'NOT_FOUND');
verifyPaypal(count($db->payments) === 1, 'A duplicate capture confirmation must not double-record a payment');

// 6. Cross-client capture is rejected even with a correct order id.
rejectsPaypal(fn () => $service->captureOrder(2, 'inv-1', 'ORDER-1'), 'NOT_FOUND');

// 7. A capture whose amount does not match the invoice's outstanding
// balance is rejected outright (defends against a tampered/mismatched
// PayPal response) and does not record a payment.
$dbMismatch = new PaypalTestPDO();
$dbMismatch->invoices = [paypalInvoiceRow(['id' => 3, 'public_id' => 'inv-3', 'client_id' => 1, 'outstanding_balance' => '50.00', 'paypal_order_id' => 'ORDER-3'])];
$gatewayMismatch = new RecordingPaypalGateway();
$gatewayMismatch->captureOrderResponse = captureResponse('CAPTURE-3', '5.00');
$serviceMismatch = new AlchemizePaypalPaymentService(new AlchemizeExternalIntegrationRepository($dbMismatch), $gatewayMismatch);
try {
    $serviceMismatch->captureOrder(1, 'inv-3', 'ORDER-3');
    throw new RuntimeException('Expected an amount-mismatch failure');
} catch (AlchemizeRequestException $error) {
    verifyPaypal($error->errorCode === 'INTEGRATION_UNAVAILABLE', 'Amount mismatch should surface as a sanitized integration failure');
}
verifyPaypal(count($dbMismatch->payments) === 0, 'An amount-mismatched capture must not record a payment');

// 8. reconcilePaypalCapture() itself is idempotent on the PayPal capture
// id, independent of invoice eligibility — the direct repository-level
// guarantee behind "duplicate callbacks/webhooks do not double-record".
$dbIdem = new PaypalTestPDO();
$dbIdem->invoices = [paypalInvoiceRow(['id' => 4, 'public_id' => 'inv-4', 'client_id' => 1, 'outstanding_balance' => '75.00', 'paypal_order_id' => 'ORDER-4'])];
$repoIdem = new AlchemizeExternalIntegrationRepository($dbIdem);
$first = $repoIdem->reconcilePaypalCapture('ORDER-4', 'CAPTURE-4', 7500);
$second = $repoIdem->reconcilePaypalCapture('ORDER-4', 'CAPTURE-4', 7500);
verifyPaypal($first === true && $second === true, 'Both calls should report success');
verifyPaypal(count($dbIdem->payments) === 1, 'reconcilePaypalCapture must not insert a second payment for the same capture id');

echo "Portal PayPal checkout: order creation uses the authoritative remaining balance, cross-client access is rejected, capture records the same invoice/payment records as elsewhere, partial-then-full payment status transitions are correct, and duplicate captures/webhooks never double-record.\n";
