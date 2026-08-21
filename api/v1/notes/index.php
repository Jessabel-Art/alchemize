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
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Notes API is temporarily unavailable.']]);
    exit;
}

$config = require $bootstrap;

try {
    $database = alchemize_database($config['database']);
    $repository = new AlchemizeNoteRepository($database);

    $user = alchemize_session_user();
    if (!is_array($user) || empty($user['user_id'])) {
        throw new AlchemizeRequestException(401, 'UNAUTHORIZED', 'Authentication required.');
    }

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = trim($_SERVER['PATH_INFO'] ?? ($_SERVER['REQUEST_URI'] ?? ''), '/');
    $parts = array_values(array_filter(explode('/', $path), static fn (string $value): bool => $value !== ''));

    if ($method === 'GET' && count($parts) === 2 && in_array($parts[0], ['lead','client','engagement'], true)) {
        $notes = $repository->listByEntity($parts[0], $parts[1]);
        alchemize_json_response(['data' => $notes], 200);
    }

    if ($method === 'POST' && $parts === []) {
        $payload = alchemize_read_json_request();
        $entityType = trim((string) ($payload['entity_type'] ?? ''));
        $entityId = trim((string) ($payload['entity_id'] ?? ''));
        $noteBody = trim((string) ($payload['note_body'] ?? ''));
        if (!in_array($entityType, ['lead','client','engagement'], true) || $entityId === '' || $noteBody === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Valid entity data and note text are required.');
        }

        $id = $repository->create([
            'public_id' => alchemize_uuid_v4(),
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'client_id' => isset($payload['client_id']) && $payload['client_id'] !== '' ? (int) $payload['client_id'] : null,
            'note_category' => trim((string) ($payload['note_category'] ?? 'general')) !== '' ? trim((string) ($payload['note_category'])) : 'general',
            'note_body' => $noteBody,
            'author_user_id' => isset($user['user_id']) ? (int) $user['user_id'] : null,
        ]);

        alchemize_json_response(['data' => ['id' => $id, 'entity_type' => $entityType]], 201);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested note route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Notes API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Notes API is temporarily unavailable.');
}
