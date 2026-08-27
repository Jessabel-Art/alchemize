<?php

declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

$configuredBootstrap = getenv('ALCHEMIZE_SERVER_BOOTSTRAP');
$documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
$bootstrapCandidates = array_filter([
    is_string($configuredBootstrap) ? $configuredBootstrap : null,
    $documentRoot !== '' ? dirname($documentRoot) . '/alchemize-server/bootstrap.php' : null,
    dirname(__DIR__, 3) . '/server/bootstrap.php',
]);

$bootstrap = null;
foreach ($bootstrapCandidates as $candidate) {
    if (is_file($candidate)) {
        $bootstrap = $candidate;
        break;
    }
}

if ($bootstrap === null) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Invoices API is temporarily unavailable.']]);
    exit;
}

$config = require $bootstrap;

try {
    $database = alchemize_database($config['database']);
    $repository = new AlchemizeInvoiceRepository($database);
    $notifications = new AlchemizeNotificationService(new AlchemizeNotificationRepository($database), alchemize_email_provider($config));

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = trim($_SERVER['PATH_INFO'] ?? ($_SERVER['REQUEST_URI'] ?? ''), '/');
    $parts = array_values(array_filter(explode('/', $path), static fn (string $value): bool => $value !== ''));

    if ($method === 'GET' && $parts === []) {
        alchemize_require_read_only_or_higher();
        alchemize_json_response(['data' => $repository->listAll()], 200);
    }

    if ($method === 'POST' && $parts === []) {
        alchemize_require_staff_or_admin();
        alchemize_require_csrf();
        $payload = alchemize_read_json_request();
        $clientId = isset($payload['client_id']) && $payload['client_id'] !== '' ? (int) $payload['client_id'] : null;
        $invoiceNumber = trim((string) ($payload['invoice_number'] ?? ''));
        if ($clientId === null || $invoiceNumber === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Client and invoice number are required.');
        }

        $lineItems = [];
        foreach ((array) ($payload['line_items'] ?? []) as $item) {
            if (!is_array($item)) continue;
            $description = trim((string) ($item['description'] ?? ''));
            $quantity = max(0.01, (float) ($item['quantity'] ?? 1));
            $unitPrice = max(0.0, (float) ($item['unit_price'] ?? 0));
            $amount = round($quantity * $unitPrice, 2);
            if ($description === '' || $amount <= 0) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Each invoice line needs a description and positive amount.');
            $lineItems[] = [
                'service_id' => !empty($item['service_id']) ? (int) $item['service_id'] : null,
                'service_code' => trim((string) ($item['service_code'] ?? '')) ?: null,
                'description' => $description, 'quantity' => number_format($quantity, 2, '.', ''),
                'unit_price' => number_format($unitPrice, 2, '.', ''), 'amount' => number_format($amount, 2, '.', ''),
                'billing_type' => trim((string) ($item['billing_type'] ?? 'custom')) ?: 'custom',
            ];
        }
        $subtotal = $lineItems !== [] ? array_sum(array_map(static fn(array $item): float => (float) $item['amount'], $lineItems)) : (float) ($payload['subtotal'] ?? 0.0);
        $adjustment = isset($payload['adjustment_total']) ? (float) $payload['adjustment_total'] : 0.0;
        $creditDeposit = isset($payload['credit_deposit_total']) ? (float) $payload['credit_deposit_total'] : 0.0;
        $paidTotal = isset($payload['paid_total']) ? (float) $payload['paid_total'] : 0.0;
        $outstandingBalance = max(0.0, ($subtotal + $adjustment - $creditDeposit) - $paidTotal);
        $status = in_array((string) ($payload['status'] ?? 'draft'), ['draft','open','partially_paid','paid','past_due','cancelled','voided'], true) ? (string) $payload['status'] : 'draft';
        $issuedAt = trim((string) ($payload['issued_at'] ?? '')) ?: ($status === 'draft' ? null : date('Y-m-d H:i:s.u'));

        $id = $repository->createWithLineItems([
            'public_id' => alchemize_uuid_v4(),
            'invoice_number' => $invoiceNumber,
            'client_id' => $clientId,
            'engagement_id' => isset($payload['engagement_id']) && $payload['engagement_id'] !== '' ? (int) $payload['engagement_id'] : null,
            'invoice_date' => trim((string) ($payload['invoice_date'] ?? date('Y-m-d'))),
            'due_date' => trim((string) ($payload['due_date'] ?? '')) !== '' ? trim((string) ($payload['due_date'])) : null,
            'status' => $status,
            'currency' => strtoupper(trim((string) ($payload['currency'] ?? 'USD'))),
            'subtotal' => number_format($subtotal, 2, '.', ''),
            'adjustment_total' => number_format($adjustment, 2, '.', ''),
            'credit_deposit_total' => number_format($creditDeposit, 2, '.', ''),
            'paid_total' => number_format($paidTotal, 2, '.', ''),
            'outstanding_balance' => number_format($outstandingBalance, 2, '.', ''),
            'client_facing_notes' => trim((string) ($payload['client_facing_notes'] ?? '')) !== '' ? trim((string) ($payload['client_facing_notes'])) : null,
            'internal_notes' => trim((string) ($payload['internal_notes'] ?? '')) !== '' ? trim((string) ($payload['internal_notes'])) : null,
            'issued_at' => $issuedAt,
        ], $lineItems);

        if ($issuedAt !== null && in_array($status, ['open','partially_paid','past_due'], true)) $notifications->notifyClient(
            (int) $payload['client_id'], 'admin.invoice.issued', 'invoice', (string) $id,
            'Invoice available', 'A new invoice is available in your secure client portal.', 'invoice-issued:' . $id,
        );
        alchemize_json_response(['data' => ['id' => $id, 'invoice_number' => $invoiceNumber, 'outstanding_balance' => number_format($outstandingBalance, 2, '.', '')]], 201);
    }

    if (count($parts) === 1 && ctype_digit((string)$parts[0]) && $method === 'GET') {
        alchemize_require_read_only_or_higher();$row=$repository->findById((int)$parts[0]);if($row===null)throw new AlchemizeRequestException(404,'NOT_FOUND','Invoice was not found.');alchemize_json_response(['data'=>$row],200);
    }
    if (count($parts) === 1 && ctype_digit((string)$parts[0]) && $method === 'PUT') {
        alchemize_require_staff_or_admin();alchemize_require_csrf();$id=(int)$parts[0];if($repository->findById($id)===null)throw new AlchemizeRequestException(404,'NOT_FOUND','Invoice was not found.');
        $payload=alchemize_read_json_request('PUT');$values=[];foreach(['invoice_number','invoice_date','due_date','currency','client_facing_notes','internal_notes','issued_at'] as $field)if(array_key_exists($field,$payload))$values[$field]=trim((string)$payload[$field])?:null;
        foreach(['client_id','engagement_id','subtotal','adjustment_total','credit_deposit_total','paid_total','outstanding_balance'] as $field)if(array_key_exists($field,$payload))$values[$field]=$payload[$field]===''?null:$payload[$field];if(isset($payload['status'])&&in_array($payload['status'],['draft','open','partially_paid','paid','past_due','cancelled','voided'],true))$values['status']=$payload['status'];
        $repository->update($id,$values);alchemize_json_response(['data'=>$repository->findById($id)],200);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested invoice route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Invoices API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Invoices API is temporarily unavailable.');
}
