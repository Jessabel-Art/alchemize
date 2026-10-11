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
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Reports API is temporarily unavailable.']]);
    exit;
}

$config = require $bootstrap;

try {
    $database = alchemize_database($config['database']);
    $repository = new AlchemizeReportRepository($database);
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = trim($_SERVER['PATH_INFO'] ?? ($_SERVER['REQUEST_URI'] ?? ''), '/');
    $parts = array_values(array_filter(explode('/', $path), static fn (string $value): bool => $value !== ''));

    if ($method === 'GET' && $parts === []) {
        $user = alchemize_require_admin();
        alchemize_json_response(['data' => $repository->listForUser((int) ($user['user_id'] ?? 0))], 200);
    }

    if ($method === 'POST' && $parts === []) {
        $user = alchemize_require_admin();
        alchemize_require_csrf();
        $payload = alchemize_read_json_request('POST');
        $name = trim((string) ($payload['name'] ?? ''));
        $reportType = trim((string) ($payload['report_type'] ?? ''));
        $config = is_array($payload['config'] ?? null) ? $payload['config'] : [];

        if ($name === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Give the saved report a name.');
        }
        if ($reportType === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a report type.');
        }

        $saved = $repository->create([
            'public_id' => alchemize_uuid_v4(),
            'name' => $name,
            'report_type' => $reportType,
            'config' => $config,
            'created_by_user_id' => isset($user['user_id']) ? (int) $user['user_id'] : null,
        ]);

        alchemize_json_response(['data' => $saved], 201);
    }

    if ($method === 'GET' && count($parts) === 1 && ctype_digit((string) $parts[0])) {
        $user = alchemize_require_admin();
        $report = $repository->findById((int) $parts[0]);
        if ($report === null || ((int) ($report['created_by_user_id'] ?? 0) !== (int) ($user['user_id'] ?? 0) && $report['created_by_user_id'] !== null)) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Saved report was not found.');
        }
        alchemize_json_response(['data' => $report], 200);
    }

    if ($method === 'PUT' && count($parts) === 1 && ctype_digit((string) $parts[0])) {
        $user = alchemize_require_admin();
        alchemize_require_csrf();
        $existing = $repository->findById((int) $parts[0]);
        if ($existing === null) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Saved report was not found.');
        }
        if ((int) ($existing['created_by_user_id'] ?? 0) !== (int) ($user['user_id'] ?? 0)) {
            throw new AlchemizeRequestException(403, 'FORBIDDEN', 'You do not have permission to update that report.');
        }
        $payload = alchemize_read_json_request('PUT');
        $values = [];
        if (isset($payload['name'])) {
            $values['name'] = trim((string) $payload['name']);
        }
        if (isset($payload['report_type'])) {
            $values['report_type'] = trim((string) $payload['report_type']);
        }
        if (array_key_exists('config', $payload)) {
            $values['config'] = is_array($payload['config']) ? $payload['config'] : [];
        }
        if (($values['name'] ?? '') === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Give the saved report a name.');
        }
        if (($values['report_type'] ?? '') === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a report type.');
        }

        alchemize_json_response(['data' => $repository->update((int) $parts[0], $values)], 200);
    }

    if ($method === 'DELETE' && count($parts) === 1 && ctype_digit((string) $parts[0])) {
        $user = alchemize_require_admin();
        alchemize_require_csrf();
        $existing = $repository->findById((int) $parts[0]);
        if ($existing === null) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Saved report was not found.');
        }
        if ((int) ($existing['created_by_user_id'] ?? 0) !== (int) ($user['user_id'] ?? 0)) {
            throw new AlchemizeRequestException(403, 'FORBIDDEN', 'You do not have permission to delete that report.');
        }

        alchemize_json_response(['data' => ['deleted' => $repository->delete((int) $parts[0])]], 200);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested report route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Reports API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Reports are temporarily unavailable.');
}
