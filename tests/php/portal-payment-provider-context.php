<?php
// Cross-provider coverage: given the identical authoritative invoice, do
// Stripe and PayPal payloads agree on the same invoice number and the
// same remaining balance, and does neither leak anything sensitive? Both
// AlchemizeStripePaymentService and AlchemizePaypalPaymentService read
// through the exact same AlchemizeExternalIntegrationRepository::
// invoiceForClient()/invoiceLineItems() — this test proves they actually
// agree in practice, not just by code inspection.
declare(strict_types=1);

require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/http/response.php';
require_once __DIR__.'/../../server/repositories/external-integration-repository.php';
require_once __DIR__.'/../../server/services/stripe-payment-service.php';
require_once __DIR__.'/../../server/services/paypal-payment-service.php';

function alchemize_uuid_v4(): string { static $n = 0; $n++; return 'cross-uuid-'.$n; }
function verifyCrossProvider(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }

final class CrossProviderTestPDO extends PDO {
    public array $invoices = [];
    public array $lineItems = [];
    public function __construct() {}
    public function prepare(string $query, array $options = []): PDOStatement|false {
        return new CrossProviderTestStatement($this, $query);
    }
}

final class CrossProviderTestStatement extends PDOStatement {
    private array $rows = [];
    public function __construct(private CrossProviderTestPDO $db, private string $sql) {}

    public function execute(?array $params = null): bool {
        $sql = $this->sql;
        $params ??= [];

        if (str_contains($sql, 'FROM invoices i INNER JOIN clients')) {
            $this->rows = array_values(array_filter($this->db->invoices, static function (array $row) use ($params): bool {
                return $row['public_id'] === $params['public_id'] && $row['client_id'] === $params['client_id'];
            }));
            return true;
        }
        if (str_contains($sql, 'FROM invoice_line_items')) {
            $this->rows = $this->db->lineItems[$params['invoice_id']] ?? [];
            return true;
        }
        // Every other write (setStripeCustomer/setInvoiceCheckout/
        // setInvoicePaypalOrder/etc.) is a no-op for this test — only the
        // outbound provider payload is under test here.
        return true;
    }

    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed {
        return array_shift($this->rows) ?? false;
    }
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array { return $this->rows; }
    public function fetchColumn(int $column = 0): mixed { return false; }
}

final class NoopStripeGateway implements AlchemizeStripeGateway {
    public array $createCheckoutSessionCalls = [];
    public function createCustomer(array $parameters, string $idempotencyKey): array { return ['id' => 'cus_shared']; }
    public function createCheckoutSession(array $parameters, string $idempotencyKey): array {
        $this->createCheckoutSessionCalls[] = $parameters;
        return ['id' => 'cs_shared', 'url' => 'https://checkout.stripe.com/c/pay/cs_shared'];
    }
    public function retrieveCheckoutSession(string $sessionId): array { return ['status' => 'expired']; }
}

final class NoopPaypalGateway implements AlchemizePaypalGateway {
    public array $createOrderCalls = [];
    public function createOrder(array $payload): array {
        $this->createOrderCalls[] = $payload;
        return ['id' => 'ORDER-SHARED', 'status' => 'CREATED'];
    }
    public function captureOrder(string $orderId): array { return []; }
}

$sharedInvoice = [
    'id' => 1,
    'public_id' => 'inv-shared',
    'client_id' => 1,
    'invoice_number' => 'INV-SHARED-0001',
    'currency' => 'USD',
    'subtotal' => '199.00',
    'adjustment_total' => '0.00',
    'credit_deposit_total' => '0.00',
    'paid_total' => '20.00',
    'outstanding_balance' => '179.00',
    'status' => 'partially_paid',
    'issued_at' => '2026-09-01 00:00:00',
    'stripe_customer_id' => 'cus_existing',
    'stripe_checkout_session_id' => null,
    'paypal_order_id' => null,
    'primary_email' => 'client@example.com',
    'display_name' => 'Jordan Rivera',
    'engagement_public_id' => 'eng-shared',
    'engagement_title' => 'Business Consulting',
    'internal_notes' => 'Staff-only collections memo — never send to a provider',
];

$stripeDb = new CrossProviderTestPDO();
$stripeDb->invoices = [$sharedInvoice];
$stripeDb->lineItems[1] = [
    ['id' => 'li-1', 'description' => 'Business Consulting retainer', 'quantity' => '1.00', 'unit_price' => '199.00', 'amount' => '199.00'],
];
$stripeGateway = new NoopStripeGateway();
$stripeService = new AlchemizeStripePaymentService(
    new AlchemizeExternalIntegrationRepository($stripeDb),
    $stripeGateway,
    ['app_url' => 'https://app.example.test', 'secret_key' => 'sk_test_fake']
);
$stripeService->checkout(1, 'inv-shared');
$stripeParams = $stripeGateway->createCheckoutSessionCalls[0];

$paypalDb = new CrossProviderTestPDO();
$paypalDb->invoices = [$sharedInvoice];
$paypalDb->lineItems[1] = $stripeDb->lineItems[1];
$paypalGateway = new NoopPaypalGateway();
$paypalService = new AlchemizePaypalPaymentService(
    new AlchemizeExternalIntegrationRepository($paypalDb),
    $paypalGateway
);
$paypalService->createOrder(1, 'inv-shared');
$paypalUnit = $paypalGateway->createOrderCalls[0]['purchase_units'][0];

// Both providers reference the same real invoice number.
verifyCrossProvider(
    $stripeParams['metadata[alchemize_invoice_number]'] === 'INV-SHARED-0001'
        && $paypalUnit['invoice_id'] === 'INV-SHARED-0001',
    'Stripe and PayPal must reference the same invoice number'
);

// Both providers charge the same authoritative remaining balance — the
// $179.00 remaining balance, not the $199.00 original invoice total —
// because both read through the same invoiceForClient() balance.
verifyCrossProvider(
    (int) $stripeParams['line_items[0][price_data][unit_amount]'] === 17900,
    'Stripe must charge the shared authoritative remaining balance in cents'
);
verifyCrossProvider(
    $paypalUnit['amount']['value'] === '179.00',
    'PayPal must charge the shared authoritative remaining balance'
);

// Both providers surface the same real service context, not two different
// or hardcoded descriptions.
verifyCrossProvider(
    str_contains((string) ($stripeParams['payment_intent_data[metadata][alchemize_service_summary]'] ?? ''), 'Business Consulting')
        && str_contains($paypalUnit['description'], 'Business Consulting'),
    'Stripe and PayPal should both surface the same real engagement/service context'
);

// Neither provider payload leaks internal-only invoice content.
verifyCrossProvider(!str_contains(json_encode($stripeParams), 'Staff-only'), 'Stripe payload must not leak internal invoice notes');
verifyCrossProvider(!str_contains(json_encode($paypalUnit), 'Staff-only'), 'PayPal payload must not leak internal invoice notes');

echo "Cross-provider payment context: Stripe and PayPal both reference the same real invoice number, both charge the same authoritative remaining balance, both surface the same real service context, and neither leaks internal-only invoice content.\n";
