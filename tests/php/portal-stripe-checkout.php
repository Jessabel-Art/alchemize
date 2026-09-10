<?php
// Focused coverage for the Client Billing "Pay with Stripe" checkout
// payload: AlchemizeStripePaymentService::checkout() backed by a stateful
// mock PDO (real AlchemizeExternalIntegrationRepository SQL, in-memory
// rows) and a recording AlchemizeStripeGateway double, so the actual
// balance/line-item/metadata logic is exercised without a network call to
// Stripe.
declare(strict_types=1);

require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/http/response.php';
require_once __DIR__.'/../../server/repositories/external-integration-repository.php';
require_once __DIR__.'/../../server/services/stripe-payment-service.php';

function alchemize_uuid_v4(): string { static $n = 0; $n++; return 'stripe-uuid-'.$n; }
function verifyStripe(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function rejectsStripe(callable $operation, string $code): void {
    try { $operation(); } catch (AlchemizeRequestException $error) {
        verifyStripe($error->errorCode === $code, "Expected {$code}, got {$error->errorCode}: {$error->getMessage()}");
        return;
    }
    throw new RuntimeException("Expected {$code} but no exception was thrown");
}

final class StripeTestPDO extends PDO {
    public array $invoices = [];
    public array $clients = [];
    public array $lineItems = []; // invoice_id => [ [description, quantity, unit_price, amount], ... ]
    public function __construct() {}
    public function prepare(string $query, array $options = []): PDOStatement|false {
        return new StripeTestStatement($this, $query);
    }
}

final class StripeTestStatement extends PDOStatement {
    private array $rows = [];
    public function __construct(private StripeTestPDO $db, private string $sql) {}

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

        if (str_contains($sql, 'FROM invoice_line_items')) {
            $this->rows = $this->db->lineItems[$params['invoice_id']] ?? [];
            return true;
        }

        if (str_starts_with(trim($sql), 'UPDATE clients SET stripe_customer_id')) {
            foreach ($this->db->invoices as &$row) {
                if ($row['client_id'] === $params['id']) {
                    $row['stripe_customer_id'] = $params['customer_id'];
                }
            }
            unset($row);
            return true;
        }

        if (str_starts_with(trim($sql), 'UPDATE clients SET stripe_sync_status')) {
            return true;
        }

        if (str_starts_with(trim($sql), 'UPDATE invoices SET stripe_checkout_session_id')) {
            foreach ($this->db->invoices as &$row) {
                if ($row['id'] === $params['id']) {
                    $row['stripe_checkout_session_id'] = $params['session_id'];
                    $row['stripe_payment_intent_id'] = $params['payment_intent_id'] ?? ($row['stripe_payment_intent_id'] ?? null);
                }
            }
            unset($row);
            return true;
        }

        if (str_starts_with(trim($sql), 'UPDATE invoices SET stripe_sync_status')) {
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

final class RecordingStripeGateway implements AlchemizeStripeGateway {
    public array $createCustomerCalls = [];
    public array $createCheckoutSessionCalls = [];
    public mixed $createCustomerResponse = ['id' => 'cus_test'];
    public mixed $createCheckoutSessionResponse = null;

    public function createCustomer(array $parameters, string $idempotencyKey): array {
        $this->createCustomerCalls[] = $parameters;
        return $this->createCustomerResponse;
    }
    public function createCheckoutSession(array $parameters, string $idempotencyKey): array {
        $this->createCheckoutSessionCalls[] = $parameters;
        if ($this->createCheckoutSessionResponse instanceof Throwable) throw $this->createCheckoutSessionResponse;
        return $this->createCheckoutSessionResponse;
    }
    public function retrieveCheckoutSession(string $sessionId): array {
        return ['status' => 'expired'];
    }
}

function stripeInvoiceRow(array $overrides): array {
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
        'stripe_customer_id' => 'cus_existing',
        'stripe_checkout_session_id' => null,
        'primary_email' => 'client@example.com',
        'display_name' => 'Jordan Rivera',
        'engagement_public_id' => null,
        'engagement_title' => null,
        'internal_notes' => 'Staff-only collections memo — never send to a provider',
    ], $overrides);
}

function stripeLineItemRow(string $description, string $amount): array {
    return ['id' => 'li-' . $description, 'description' => $description, 'quantity' => '1.00', 'unit_price' => $amount, 'amount' => $amount];
}

function checkoutSessionResponse(string $id = 'cs_test_1'): array {
    return ['id' => $id, 'url' => 'https://checkout.stripe.com/c/pay/' . $id, 'payment_intent' => 'pi_test_1'];
}

function stripeParam(array $parameters, string $key): mixed {
    return $parameters[$key] ?? null;
}

// 1. A fully unpaid invoice whose real line items sum exactly to the
// outstanding balance sends those as real Stripe line items, the charged
// amount is the authoritative remaining balance, and metadata carries
// useful invoice/service context (not a hardcoded label).
$db = new StripeTestPDO();
$db->invoices = [stripeInvoiceRow([
    'id' => 1, 'public_id' => 'inv-1', 'client_id' => 1,
    'subtotal' => '150.00', 'outstanding_balance' => '150.00',
    'engagement_title' => 'Business Consulting', 'engagement_public_id' => 'eng-1',
])];
$db->lineItems[1] = [
    stripeLineItemRow('Advisory session', '100.00'),
    stripeLineItemRow('Document review', '50.00'),
];
$repository = new AlchemizeExternalIntegrationRepository($db);
$gateway = new RecordingStripeGateway();
$gateway->createCheckoutSessionResponse = checkoutSessionResponse('cs_itemized');
$config = ['app_url' => 'https://app.example.test', 'secret_key' => 'sk_test_fake'];
$service = new AlchemizeStripePaymentService($repository, $gateway, $config);

$result = $service->checkout(1, 'inv-1');
verifyStripe($result['checkout_url'] === 'https://checkout.stripe.com/c/pay/cs_itemized', 'Checkout URL should come from the gateway response');
$params = $gateway->createCheckoutSessionCalls[0];
verifyStripe(stripeParam($params, 'line_items[0][price_data][unit_amount]') === 10000, 'First line item amount should be in cents');
verifyStripe(stripeParam($params, 'line_items[0][price_data][product_data][name]') === 'Advisory session', 'Real line item description should be used as the product name');
verifyStripe(stripeParam($params, 'line_items[1][price_data][unit_amount]') === 5000, 'Second line item amount should be in cents');
$itemTotalCents = 0;
for ($i = 0; isset($params["line_items[{$i}][price_data][unit_amount]"]); $i++) {
    $itemTotalCents += (int) $params["line_items[{$i}][price_data][unit_amount]"];
}
verifyStripe($itemTotalCents === 15000, 'Sum of Stripe line items must equal the authoritative outstanding balance in cents');
verifyStripe(stripeParam($params, 'metadata[alchemize_invoice_id]') === 'inv-1', 'metadata must reference the invoice public id');
verifyStripe(stripeParam($params, 'metadata[alchemize_invoice_number]') === 'INV-0001', 'metadata must reference the human invoice number');
verifyStripe(stripeParam($params, 'metadata[alchemize_client_id]') === '1', 'metadata must reference the client id');
verifyStripe(stripeParam($params, 'metadata[alchemize_engagement_id]') === 'eng-1', 'metadata must reference the engagement public id when one exists');
verifyStripe(stripeParam($params, 'metadata[payment_type]') === 'invoice', 'metadata should record the payment purpose');
verifyStripe(stripeParam($params, 'metadata[alchemize_remaining_balance]') === '150.00', 'metadata should record the authoritative remaining balance');
verifyStripe(stripeParam($params, 'payment_intent_data[metadata][alchemize_invoice_number]') === 'INV-0001', 'payment_intent_data.metadata should carry the invoice number so it survives beyond the Checkout Session');
verifyStripe(stripeParam($params, 'payment_intent_data[metadata][alchemize_service_summary]') === 'Business Consulting', 'payment_intent_data.metadata should carry the real service summary, not a hardcoded label');
verifyStripe(!str_contains(json_encode($params), 'Staff-only'), 'Internal-only invoice notes must never reach Stripe');

// 2. A partially paid invoice never re-sends the original full
// itemization once it no longer sums to the (lower) remaining balance —
// a single honest "Remaining balance" line item is used instead, charging
// exactly the authoritative remaining balance, not the original total.
$dbPartial = new StripeTestPDO();
$dbPartial->invoices = [stripeInvoiceRow([
    'id' => 2, 'public_id' => 'inv-2', 'client_id' => 1,
    'subtotal' => '199.00', 'paid_total' => '20.00', 'outstanding_balance' => '179.00', 'status' => 'partially_paid',
    'engagement_title' => 'Business Consulting',
])];
$dbPartial->lineItems[2] = [stripeLineItemRow('Business Consulting retainer', '199.00')];
$repositoryPartial = new AlchemizeExternalIntegrationRepository($dbPartial);
$gatewayPartial = new RecordingStripeGateway();
$gatewayPartial->createCheckoutSessionResponse = checkoutSessionResponse('cs_partial');
$servicePartial = new AlchemizeStripePaymentService($repositoryPartial, $gatewayPartial, $config);
$servicePartial->checkout(1, 'inv-2');
$partialParams = $gatewayPartial->createCheckoutSessionCalls[0];
verifyStripe(!isset($partialParams['line_items[1][price_data][unit_amount]']), 'A partially paid invoice must send exactly one line item, not the original itemization');
verifyStripe((int) stripeParam($partialParams, 'line_items[0][price_data][unit_amount]') === 17900, 'Checkout Session must charge exactly the authoritative remaining balance ($179.00), not the original $199.00 total');
verifyStripe(stripeParam($partialParams, 'line_items[0][price_data][product_data][name]') === 'Remaining balance — INV-0001', 'The single line item name should clearly state it is a remaining balance for the real invoice number');
verifyStripe(stripeParam($partialParams, 'line_items[0][price_data][product_data][description]') === 'Business Consulting', 'The single line item description should carry real service context');
verifyStripe(stripeParam($partialParams, 'metadata[alchemize_original_invoice_total]') === '199.00', 'metadata should record the original invoice total separately from the amount charged');
verifyStripe(stripeParam($partialParams, 'metadata[alchemize_amount_previously_paid]') === '20.00', 'metadata should record the amount already paid');

// 3. The client cannot manipulate the amount charged: checkout()'s public
// signature accepts only a client id and invoice public id — no amount
// parameter exists for a caller to influence — and the two checkouts above
// already prove the charged amount tracks the server-computed outstanding
// balance exactly ($150.00 and $179.00) rather than any client input or
// the original invoice total ($199.00 for inv-2).
rejectsStripe(fn () => $service->checkout(2, 'inv-1'), 'NOT_FOUND');

// 4. Cross-client checkout is rejected before any gateway call is made.
$gatewayCallsBefore = count($gateway->createCheckoutSessionCalls);
try { $service->checkout(999, 'inv-1'); } catch (AlchemizeRequestException) {}
verifyStripe(count($gateway->createCheckoutSessionCalls) === $gatewayCallsBefore, 'A cross-client checkout attempt must never reach the Stripe gateway');

echo "Portal Stripe checkout: fully-unpaid invoices with reconciling line items send real itemization to Stripe, partially paid invoices send a single honest remaining-balance line item at the authoritative amount, metadata (session + payment_intent) carries real invoice/service context without leaking internal notes, and cross-client checkout is rejected before reaching the gateway.\n";
