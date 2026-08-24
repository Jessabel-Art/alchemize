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
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Payments API is temporarily unavailable.']]);
    exit;
}

$config = require $bootstrap;

try {
    $database = alchemize_database($config['database']);
    $repository = new AlchemizePaymentRepository($database);

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
        $invoiceId = isset($payload['invoice_id']) && $payload['invoice_id'] !== '' ? (int) $payload['invoice_id'] : null;
        $clientId = isset($payload['client_id']) && $payload['client_id'] !== '' ? (int) $payload['client_id'] : null;
        $amount = isset($payload['amount']) ? (float) $payload['amount'] : 0.0;
        if ($invoiceId === null || $clientId === null || $amount <= 0) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Invoice, client, and amount are required.');
        }

        $id = $repository->create([
            'public_id' => alchemize_uuid_v4(),
            'invoice_id' => $invoiceId,
            'client_id' => $clientId,
            'payment_date' => trim((string) ($payload['payment_date'] ?? date('Y-m-d'))),
            'amount' => number_format($amount, 2, '.', ''),
            'payment_method' => trim((string) ($payload['payment_method'] ?? 'manual')) !== '' ? trim((string) ($payload['payment_method'])) : 'manual',
            'external_reference' => trim((string) ($payload['external_reference'] ?? '')) !== '' ? trim((string) ($payload['external_reference'])) : null,
            'internal_note' => trim((string) ($payload['internal_note'] ?? '')) !== '' ? trim((string) ($payload['internal_note'])) : null,
            'recorded_by_user_id' => isset($payload['recorded_by_user_id']) && $payload['recorded_by_user_id'] !== '' ? (int) $payload['recorded_by_user_id'] : null,
        ]);

        alchemize_json_response(['data' => ['id' => $id, 'amount' => number_format($amount, 2, '.', '')]], 201);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested payment route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Payments API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Payments API is temporarily unavailable.');
}
