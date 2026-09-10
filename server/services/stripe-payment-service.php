<?php

declare(strict_types=1);

interface AlchemizeStripeGateway
{
    public function createCustomer(array $parameters, string $idempotencyKey): array;
    public function createCheckoutSession(array $parameters, string $idempotencyKey): array;
    public function retrieveCheckoutSession(string $sessionId): array;
}

final class AlchemizeStripeHttpGateway implements AlchemizeStripeGateway
{
    public function __construct(private readonly string $secretKey) {}

    public function createCustomer(array $parameters, string $idempotencyKey): array
    {
        return $this->request('POST', '/v1/customers', $parameters, $idempotencyKey);
    }

    public function createCheckoutSession(array $parameters, string $idempotencyKey): array
    {
        return $this->request('POST', '/v1/checkout/sessions', $parameters, $idempotencyKey);
    }

    public function retrieveCheckoutSession(string $sessionId): array
    {
        if (!preg_match('/^cs_[A-Za-z0-9_]+$/', $sessionId)) throw new RuntimeException('Invalid Stripe session identifier.');
        return $this->request('GET', '/v1/checkout/sessions/' . rawurlencode($sessionId), []);
    }

    private function request(string $method, string $path, array $parameters, ?string $idempotencyKey = null): array
    {
        if ($this->secretKey === '' || !function_exists('curl_init')) throw new RuntimeException('Stripe is not configured.');
        $handle = curl_init('https://api.stripe.com' . $path);
        $headers = ['Authorization: Bearer ' . $this->secretKey];
        if ($idempotencyKey !== null) $headers[] = 'Idempotency-Key: ' . $idempotencyKey;
        curl_setopt_array($handle, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_HTTPHEADER => $headers]);
        if ($method === 'POST') {
            curl_setopt($handle, CURLOPT_POST, true);
            curl_setopt($handle, CURLOPT_POSTFIELDS, http_build_query($parameters));
        }
        $body = curl_exec($handle); $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        if (!is_string($body) || $status < 200 || $status >= 300) {
            $errorClass = $status === 0 ? 'transport_error' : 'provider_rejected';
            curl_close($handle); throw new RuntimeException('Stripe request failed: ' . $errorClass);
        }
        curl_close($handle); $decoded = json_decode($body, true);
        if (!is_array($decoded) || empty($decoded['id'])) throw new RuntimeException('Stripe returned an invalid response.');
        return $decoded;
    }
}

final class AlchemizeStripePaymentService
{
    public function __construct(
        private readonly AlchemizeExternalIntegrationRepository $repository,
        private readonly AlchemizeStripeGateway $gateway,
        private readonly array $config,
    ) {}

    public function checkout(int $clientId, string $invoicePublicId): array
    {
        $invoice = $this->repository->invoiceForClient($invoicePublicId, $clientId);
        if ($invoice === null) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The payable invoice was not found.');
        if (trim((string) ($this->config['secret_key'] ?? '')) === '') {
            $this->repository->setInvoiceStripeFailure((int) $invoice['id'], 'not_configured', 'not_configured');
            throw new AlchemizeRequestException(503, 'INTEGRATION_UNAVAILABLE', 'Online payment is not configured.');
        }
        try {
            if (!empty($invoice['stripe_checkout_session_id'])) {
                $existing = $this->gateway->retrieveCheckoutSession((string) $invoice['stripe_checkout_session_id']);
                if (($existing['status'] ?? '') === 'open' && str_starts_with((string) ($existing['url'] ?? ''), 'https://checkout.stripe.com/')) {
                    return ['checkout_url' => (string) $existing['url'], 'status' => 'ready'];
                }
            }
            $customerId = trim((string) ($invoice['stripe_customer_id'] ?? ''));
            if ($customerId === '') {
                $customer = $this->gateway->createCustomer([
                    'email' => (string) $invoice['primary_email'], 'name' => (string) $invoice['display_name'],
                    'metadata[alchemize_client_id]' => (string) $clientId,
                ], 'client-' . $clientId);
                $customerId = (string) $customer['id'];
                $this->repository->setStripeCustomer($clientId, $customerId);
            }
            // The amount actually charged is always the authoritative
            // remaining balance computed server-side — never the original
            // invoice total, regardless of how line items below are built.
            $amount = (int) round((float) $invoice['outstanding_balance'] * 100);
            $appUrl = rtrim((string) ($this->config['app_url'] ?? ''), '/');
            $currency = strtolower((string) $invoice['currency']);
            $invoiceNumber = (string) $invoice['invoice_number'];

            $lineItems = $this->repository->invoiceLineItems((int) $invoice['id']);
            $lineItemsTotalCents = 0;
            foreach ($lineItems as $item) {
                $lineItemsTotalCents += (int) round((float) $item['amount'] * 100);
            }
            $itemsReconcile = $lineItems !== [] && $lineItemsTotalCents === $amount;

            $serviceSummary = AlchemizeExternalIntegrationRepository::invoiceServiceSummary($invoice, $lineItems);

            $parameters = [
                'mode' => 'payment', 'customer' => $customerId,
                'success_url' => $appUrl . '/client-portal/billing?payment=processing',
                'cancel_url' => $appUrl . '/client-portal/billing?payment=cancelled',
                'metadata[alchemize_invoice_id]' => $invoicePublicId,
                'metadata[alchemize_invoice_number]' => $invoiceNumber,
                'metadata[alchemize_client_id]' => (string) $clientId,
                'metadata[payment_type]' => 'invoice',
                'metadata[alchemize_original_invoice_total]' => number_format(
                    (float) $invoice['subtotal'] + (float) $invoice['adjustment_total'] - (float) $invoice['credit_deposit_total'],
                    2, '.', ''
                ),
                'metadata[alchemize_amount_previously_paid]' => number_format((float) $invoice['paid_total'], 2, '.', ''),
                'metadata[alchemize_remaining_balance]' => number_format((float) $invoice['outstanding_balance'], 2, '.', ''),
                'payment_intent_data[metadata][alchemize_invoice_id]' => $invoicePublicId,
                'payment_intent_data[metadata][alchemize_invoice_number]' => $invoiceNumber,
            ];
            if (!empty($invoice['engagement_public_id'])) {
                $parameters['metadata[alchemize_engagement_id]'] = (string) $invoice['engagement_public_id'];
            }
            if ($serviceSummary !== '') {
                $parameters['payment_intent_data[metadata][alchemize_service_summary]'] = self::truncate($serviceSummary, 500);
            }

            if ($itemsReconcile) {
                // Fully (or exactly-)unpaid invoice: the real line items sum
                // to the authoritative balance, so send them as-is.
                foreach (array_values($lineItems) as $index => $item) {
                    $name = trim((string) $item['description']);
                    if ($name === '') $name = 'Invoice ' . $invoiceNumber;
                    $parameters["line_items[{$index}][price_data][currency]"] = $currency;
                    $parameters["line_items[{$index}][price_data][product_data][name]"] = self::truncate($name, 250);
                    $parameters["line_items[{$index}][price_data][unit_amount]"] = (int) round((float) $item['amount'] * 100);
                    $parameters["line_items[{$index}][quantity]"] = 1;
                }
            } else {
                // Partial payment (or line items that otherwise don't sum to
                // the remaining balance): never re-send the original full
                // itemization against a lower charge. Send one honest
                // "remaining balance" line instead of fabricating an
                // allocation across the original lines.
                $parameters['line_items[0][price_data][currency]'] = $currency;
                $parameters['line_items[0][price_data][product_data][name]'] =
                    self::truncate('Remaining balance — ' . $invoiceNumber, 250);
                if ($serviceSummary !== '') {
                    $parameters['line_items[0][price_data][product_data][description]'] = self::truncate($serviceSummary, 500);
                }
                $parameters['line_items[0][price_data][unit_amount]'] = $amount;
                $parameters['line_items[0][quantity]'] = 1;
            }

            $session = $this->gateway->createCheckoutSession($parameters, 'invoice-' . $invoicePublicId . '-' . $amount);
            $this->repository->setInvoiceCheckout((int) $invoice['id'], (string) $session['id'], isset($session['payment_intent']) ? (string) $session['payment_intent'] : null);
            $checkoutUrl = (string) ($session['url'] ?? '');
            if (!str_starts_with($checkoutUrl, 'https://checkout.stripe.com/')) throw new RuntimeException('Stripe returned an invalid checkout URL.');
            return ['checkout_url' => $checkoutUrl, 'status' => 'ready'];
        } catch (AlchemizeRequestException $error) { throw $error; }
        catch (Throwable $error) {
            // Temporary diagnostic instrumentation: without this, the real
            // Throwable (Stripe/provider/DB) is discarded the moment it is
            // converted into the sanitized INTEGRATION_UNAVAILABLE response.
            alchemize_runtime_error_log('portal/billing/{id}/checkout (stripe)', $error, ['invoice_id' => (int) $invoice['id']]);
            $this->repository->setInvoiceStripeFailure((int) $invoice['id'], 'failed', 'provider_error');
            throw new AlchemizeRequestException(503, 'INTEGRATION_UNAVAILABLE', 'Online payment is temporarily unavailable.');
        }
    }

    private static function truncate(string $value, int $maxLength): string
    {
        return mb_strlen($value) > $maxLength ? mb_substr($value, 0, $maxLength) : $value;
    }
}
