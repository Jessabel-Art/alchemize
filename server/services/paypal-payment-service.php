<?php

declare(strict_types=1);

interface AlchemizePaypalGateway
{
    public function createOrder(array $payload): array;
    public function captureOrder(string $orderId): array;
}

final class AlchemizePaypalHttpGateway implements AlchemizePaypalGateway
{
    private string $clientId;
    private string $clientSecret;
    private string $mode;

    public function __construct(array $config)
    {
        $this->clientId = trim((string) ($config['client_id'] ?? ''));
        $this->clientSecret = trim((string) ($config['client_secret'] ?? ''));
        $this->mode = strtolower(trim((string) ($config['mode'] ?? 'sandbox')));

        if ($this->clientId === '' || $this->clientSecret === '') {
            throw new RuntimeException('PayPal credentials are not configured.');
        }

        if (!in_array($this->mode, ['sandbox', 'live'], true)) {
            throw new RuntimeException('Invalid PayPal mode.');
        }
    }

    public function createOrder(array $payload): array
    {
        return $this->request('POST', '/v2/checkout/orders', $payload, $this->getAccessToken());
    }

    public function captureOrder(string $orderId): array
    {
        return $this->request(
            'POST',
            '/v2/checkout/orders/' . rawurlencode($orderId) . '/capture',
            null,
            $this->getAccessToken()
        );
    }

    private function getAccessToken(): string
    {
        if (!function_exists('curl_init')) {
            throw new RuntimeException('cURL is not available.');
        }

        $handle = curl_init(
            $this->baseUrl() . '/v1/oauth2/token'
        );

        curl_setopt_array($handle, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_USERPWD => $this->clientId . ':' . $this->clientSecret,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Accept-Language: en_US',
                'Content-Type: application/x-www-form-urlencoded',
            ],
            CURLOPT_TIMEOUT => 20,
        ]);

        $body = curl_exec($handle);
        $status = (int) curl_getinfo(
            $handle,
            CURLINFO_RESPONSE_CODE
        );
        $error = curl_error($handle);

        curl_close($handle);

        if (!is_string($body)) {
            throw new RuntimeException(
                'PayPal authentication transport failed: ' . $error
            );
        }

        $decoded = json_decode($body, true);

        if (
            $status < 200
            || $status >= 300
            || !is_array($decoded)
        ) {
            throw new RuntimeException(
                'PayPal authentication failed with HTTP status '
                . $status
                . '.'
            );
        }

        $token = trim(
            (string) ($decoded['access_token'] ?? '')
        );

        if ($token === '') {
            throw new RuntimeException(
                'PayPal did not return an access token.'
            );
        }

        return $token;
    }

    private function request(
        string $method,
        string $path,
        ?array $payload,
        string $accessToken
    ): array {
        $handle = curl_init(
            $this->baseUrl() . $path
        );

        $headers = [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json',
            'Accept: application/json',
        ];

        $options = [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 20,
        ];

        if ($payload !== null) {
            $options[CURLOPT_POSTFIELDS] = json_encode(
                $payload,
                JSON_THROW_ON_ERROR
            );
        }

        curl_setopt_array($handle, $options);

        $body = curl_exec($handle);
        $status = (int) curl_getinfo(
            $handle,
            CURLINFO_RESPONSE_CODE
        );
        $error = curl_error($handle);

        curl_close($handle);

        if (!is_string($body)) {
            throw new RuntimeException(
                'PayPal API transport failed: ' . $error
            );
        }

        $decoded = json_decode($body, true);

        if (
            $status < 200
            || $status >= 300
            || !is_array($decoded)
        ) {
            $message = is_array($decoded)
                ? trim((string) ($decoded['message'] ?? ''))
                : '';

            throw new RuntimeException(
                'PayPal API request failed with HTTP status '
                . $status
                . ($message !== '' ? ': ' . $message : '.')
            );
        }

        return $decoded;
    }

    private function baseUrl(): string
    {
        return $this->mode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }
}

final class AlchemizePaypalPaymentService
{
    public function __construct(
        private readonly AlchemizeExternalIntegrationRepository $repository,
        private readonly AlchemizePaypalGateway $gateway,
    ) {}

    public function createOrder(int $clientId, string $invoicePublicId): array
    {
        $invoice = $this->repository->invoiceForClient($invoicePublicId, $clientId);

        if ($invoice === null) {
            throw new AlchemizeRequestException(
                404,
                'NOT_FOUND',
                'The payable invoice was not found.'
            );
        }

        // The authoritative amount charged is always the server-computed
        // remaining balance — never the original invoice total, regardless
        // of whether items[] below is used.
        $amount = number_format(
            (float) $invoice['outstanding_balance'],
            2,
            '.',
            ''
        );

        if ((float) $amount <= 0) {
            throw new AlchemizeRequestException(
                409,
                'INVOICE_NOT_PAYABLE',
                'This invoice does not have an outstanding balance.'
            );
        }

        try {
            $currency = strtoupper((string) $invoice['currency']);
            $invoiceNumber = (string) $invoice['invoice_number'];
            $amountCents = (int) round(((float) $amount) * 100);

            $lineItems = $this->repository->invoiceLineItems((int) $invoice['id']);
            $lineItemsTotalCents = 0;
            foreach ($lineItems as $item) {
                $lineItemsTotalCents += (int) round((float) $item['amount'] * 100);
            }
            $itemsReconcile = $lineItems !== [] && $lineItemsTotalCents === $amountCents;

            $serviceSummary = AlchemizeExternalIntegrationRepository::invoiceServiceSummary($invoice, $lineItems);

            $description = $itemsReconcile
                ? ('Alchemize invoice ' . $invoiceNumber . ($serviceSummary !== '' ? ' — ' . $serviceSummary : ''))
                : ('Remaining balance for ' . $invoiceNumber . ($serviceSummary !== '' ? ' — ' . $serviceSummary : ''));

            $purchaseUnit = [
                'reference_id' => $invoicePublicId,
                'description' => self::truncate($description, 127),
                'custom_id' => $invoicePublicId,
                'invoice_id' => $invoiceNumber,
                'amount' => [
                    'currency_code' => $currency,
                    'value' => $amount,
                ],
            ];

            if ($itemsReconcile) {
                // Fully (or exactly-)unpaid invoice: the real line items sum
                // to the authoritative balance, so send them as-is. The
                // breakdown must reconcile to amount.value exactly, which is
                // guaranteed here since $itemsReconcile only true means the
                // items already sum to $amount.
                $items = [];
                foreach ($lineItems as $item) {
                    $name = trim((string) $item['description']);
                    if ($name === '') $name = 'Invoice ' . $invoiceNumber;
                    $items[] = [
                        'name' => self::truncate($name, 127),
                        'quantity' => '1',
                        'unit_amount' => [
                            'currency_code' => $currency,
                            'value' => number_format((float) $item['amount'], 2, '.', ''),
                        ],
                    ];
                }
                $purchaseUnit['items'] = $items;
                $purchaseUnit['amount']['breakdown'] = [
                    'item_total' => ['currency_code' => $currency, 'value' => $amount],
                ];
            }
            // Partial payment (or line items that otherwise don't sum to
            // the remaining balance): never re-send the original full
            // itemization against a lower charge — the description above
            // already carries the real invoice/service context without
            // fabricating a per-item allocation.

            $payload = [
                'intent' => 'CAPTURE',
                'purchase_units' => [$purchaseUnit],
            ];

            $order = $this->gateway->createOrder($payload);

            $orderId = trim((string) ($order['id'] ?? ''));

            if ($orderId === '') {
                throw new RuntimeException('PayPal did not return an order ID.');
            }

            $this->repository->setInvoicePaypalOrder(
                (int) $invoice['id'],
                $orderId
            );

            return [
                'order_id' => $orderId,
                'status' => strtolower((string) ($order['status'] ?? 'created')),
            ];
        } catch (AlchemizeRequestException $error) {
            throw $error;
        } catch (Throwable $error) {
            alchemize_runtime_error_log(
                'portal/billing/{id}/paypal/order',
                $error,
                ['client_id' => $clientId, 'invoice_id' => (int) $invoice['id']]
            );

            throw new AlchemizeRequestException(
                503,
                'INTEGRATION_UNAVAILABLE',
                'PayPal payment is temporarily unavailable.'
            );
        }
    }

    public function captureOrder(
        int $clientId,
        string $invoicePublicId,
        string $orderId
    ): array {
        $invoice = $this->repository->invoiceForClient(
            $invoicePublicId,
            $clientId
        );

        if ($invoice === null) {
            throw new AlchemizeRequestException(
                404,
                'NOT_FOUND',
                'The payable invoice was not found.'
            );
        }

        if (
            trim((string) ($invoice['paypal_order_id'] ?? '')) === ''
            || !hash_equals(
                (string) $invoice['paypal_order_id'],
                trim($orderId)
            )
        ) {
            throw new AlchemizeRequestException(
                409,
                'PAYPAL_ORDER_MISMATCH',
                'The PayPal order does not match this invoice.'
            );
        }

        try {
            $response = $this->gateway->captureOrder($orderId);

            $capture = $response['purchase_units'][0]['payments']['captures'][0] ?? null;

            if (!is_array($capture)) {
                throw new RuntimeException(
                    'PayPal did not return a payment capture.'
                );
            }

            $captureId = trim((string) ($capture['id'] ?? ''));
            $captureStatus = strtoupper(
                trim((string) ($capture['status'] ?? ''))
            );

            if ($captureId === '' || $captureStatus !== 'COMPLETED') {
                throw new RuntimeException(
                    'PayPal payment capture was not completed.'
                );
            }

            $capturedValue = (string) ($capture['amount']['value'] ?? '0');
            $capturedCurrency = strtoupper(
                trim((string) ($capture['amount']['currency_code'] ?? ''))
            );

            $amountCents = (int) round(((float) $capturedValue) * 100);
            $expectedAmountCents = (int) round(
                ((float) $invoice['outstanding_balance']) * 100
            );
            $expectedCurrency = strtoupper(
                trim((string) ($invoice['currency'] ?? ''))
            );

            if (
                $amountCents !== $expectedAmountCents
                || $capturedCurrency === ''
                || $capturedCurrency !== $expectedCurrency
            ) {
                throw new RuntimeException(
                    'PayPal capture amount or currency does not match the invoice.'
                );
            }

            $reconciled = $this->repository->reconcilePaypalCapture(
                $orderId,
                $captureId,
                $amountCents
            );

            if (!$reconciled) {
                throw new RuntimeException(
                    'The PayPal payment could not be matched to an invoice.'
                );
            }

            return [
                'order_id' => $orderId,
                'capture_id' => $captureId,
                'status' => 'completed',
            ];
        } catch (AlchemizeRequestException $error) {
            throw $error;
        } catch (Throwable $error) {
            alchemize_runtime_error_log(
                'portal/billing/{id}/paypal/capture',
                $error,
                ['client_id' => $clientId, 'invoice_id' => (int) $invoice['id']]
            );

            throw new AlchemizeRequestException(
                503,
                'INTEGRATION_UNAVAILABLE',
                'PayPal payment could not be completed.'
            );
        }
    }

    private static function truncate(string $value, int $maxLength): string
    {
        return mb_strlen($value) > $maxLength ? mb_substr($value, 0, $maxLength) : $value;
    }
}
