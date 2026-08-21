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
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Documents API is temporarily unavailable.']]);
    exit;
}

$config = require $bootstrap;

try {
    $database = alchemize_database($config['database']);
    $repository = new AlchemizeDocumentRepository($database);

    $user = alchemize_session_user();
    if (!is_array($user) || empty($user['user_id'])) {
        throw new AlchemizeRequestException(401, 'UNAUTHORIZED', 'Authentication required.');
    }

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = trim($_SERVER['PATH_INFO'] ?? ($_SERVER['REQUEST_URI'] ?? ''), '/');
    $parts = array_values(array_filter(explode('/', $path), static fn (string $value): bool => $value !== ''));

    if ($method === 'GET' && $parts === []) {
        alchemize_json_response(['data' => $repository->listAll()], 200);
    }

    if ($method === 'POST' && $parts === []) {
        $payload = alchemize_read_json_request();
        $clientId = isset($payload['client_id']) && $payload['client_id'] !== '' ? (int) $payload['client_id'] : null;
        $documentName = trim((string) ($payload['document_name'] ?? ''));
        if ($clientId === null || $documentName === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Client and document name are required.');
        }

        $id = $repository->create([
            'public_id' => alchemize_uuid_v4(),
            'client_id' => $clientId,
            'engagement_id' => isset($payload['engagement_id']) && $payload['engagement_id'] !== '' ? (int) $payload['engagement_id'] : null,
            'service_id' => isset($payload['service_id']) && $payload['service_id'] !== '' ? (int) $payload['service_id'] : null,
            'document_name' => $documentName,
            'document_type' => trim((string) ($payload['document_type'] ?? '')) !== '' ? trim((string) ($payload['document_type'])) : null,
            'status' => in_array((string) ($payload['status'] ?? 'requested'), ['requested','awaiting_upload','received','under_review','accepted','replacement_requested','archived'], true) ? (string) $payload['status'] : 'requested',
            'visibility' => in_array((string) ($payload['visibility'] ?? 'internal'), ['internal','client','shared'], true) ? (string) $payload['visibility'] : 'internal',
            'requested_date' => trim((string) ($payload['requested_date'] ?? '')) !== '' ? trim((string) ($payload['requested_date'])) : null,
            'received_date' => trim((string) ($payload['received_date'] ?? '')) !== '' ? trim((string) ($payload['received_date'])) : null,
            'reviewed_date' => trim((string) ($payload['reviewed_date'] ?? '')) !== '' ? trim((string) ($payload['reviewed_date'])) : null,
            'owner_user_id' => isset($payload['owner_user_id']) && $payload['owner_user_id'] !== '' ? (int) $payload['owner_user_id'] : null,
            'internal_notes' => trim((string) ($payload['internal_notes'] ?? '')) !== '' ? trim((string) ($payload['internal_notes'])) : null,
            'storage_key' => trim((string) ($payload['storage_key'] ?? '')) !== '' ? trim((string) ($payload['storage_key'])) : null,
            'mime_type' => trim((string) ($payload['mime_type'] ?? '')) !== '' ? trim((string) ($payload['mime_type'])) : null,
        ]);

        alchemize_json_response(['data' => ['id' => $id, 'document_name' => $documentName]], 201);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested document route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Documents API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Documents API is temporarily unavailable.');
}
