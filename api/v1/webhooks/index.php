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
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Webhook API is temporarily unavailable.']]);
    exit;
}

$config = require $bootstrap;

try {
    $database = alchemize_database($config['database']);
    $repository = new AlchemizeStripeWebhookRepository($database);

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = trim($_SERVER['PATH_INFO'] ?? ($_SERVER['REQUEST_URI'] ?? ''), '/');
    $parts = array_values(array_filter(explode('/', $path), static fn (string $value): bool => $value !== ''));

    if ($method === 'POST' && $parts === ['stripe']) {
        $rawBody = file_get_contents('php://input');
        if ($rawBody === false || $rawBody === '') {
            throw new AlchemizeRequestException(400, 'INVALID_REQUEST', 'The webhook payload is empty.');
        }

        $secret = (string) ($config['stripe']['webhook_secret'] ?? '');
        if ($secret === '') {
            error_log('Stripe webhook rejected because its signing secret is not configured.');
            throw new AlchemizeRequestException(503, 'INTEGRATION_UNAVAILABLE', 'The webhook integration is not configured.');
        }
        $signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        if (!alchemize_stripe_verify_signed_payload($rawBody, $signature, $secret)) {
            http_response_code(400);
            header('Content-Type: text/plain; charset=utf-8');
            echo 'Webhook signature verification failed.';
            exit;
        }

        try {
            $payload = json_decode($rawBody, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new AlchemizeRequestException(400, 'INVALID_JSON', 'The webhook payload contains invalid JSON.');
        }

        if (!is_array($payload) || !isset($payload['id'], $payload['type'])) {
            throw new AlchemizeRequestException(400, 'INVALID_REQUEST', 'The webhook payload is missing required event metadata.');
        }

        $eventId = (string) $payload['id'];
        $eventType = (string) $payload['type'];
        if ($repository->findByStripeEventId($eventId) !== null) {
            alchemize_json_response(['data' => ['received' => true, 'status' => 'duplicate', 'event_type' => $eventType]], 200);
        }

        $processing = alchemize_stripe_process_event_payload($payload, $eventType);
        $repository->create([
            'public_id' => alchemize_uuid_v4(),
            'stripe_event_id' => $eventId,
            'event_type' => $eventType,
            'event_status' => $processing['status'],
            'payload' => json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'processed_at' => null,
        ]);

        alchemize_json_response(['data' => ['received' => true, 'status' => $processing['status'], 'event_type' => $eventType]], 200);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested webhook route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (JsonException $error) {
    alchemize_error_response(400, 'INVALID_JSON', 'The webhook payload contains invalid JSON.');
} catch (Throwable $error) {
    error_log(sprintf('Webhook API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Webhook API is temporarily unavailable.');
}
