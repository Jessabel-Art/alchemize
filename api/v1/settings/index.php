<?php

declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

$configuredBootstrap = getenv('ALCHEMIZE_SERVER_BOOTSTRAP');
$documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
$candidates = array_filter([
    is_string($configuredBootstrap) ? $configuredBootstrap : null,
    $documentRoot !== '' ? dirname($documentRoot) . '/alchemize-server/bootstrap.php' : null,
    dirname(__DIR__, 3) . '/server/bootstrap.php',
]);
$bootstrap = null;
foreach ($candidates as $candidate) if (is_file($candidate)) { $bootstrap = $candidate; break; }
if ($bootstrap === null) {
    http_response_code(500); header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Settings are temporarily unavailable.']]); exit;
}
$config = require $bootstrap;

try {
    $user = alchemize_require_admin();
    $database = alchemize_database($config['database']);
    $repository = new AlchemizeSettingsRepository($database);
    $service = new AlchemizeDataMaintenanceService($database, $user['user_id'] ?? 0);
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $parts = array_values(array_filter(explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'))));
    if ($parts === [] && $method === 'GET') {
        alchemize_json_response(['data' => $repository->all()], 200);
    }
    if ($parts === [] && $method === 'PUT') {
        alchemize_require_csrf();
        $payload = alchemize_read_json_request('PUT');
        alchemize_json_response(['data' => $repository->update($payload, (int) $user['user_id'])], 200);
    }
    if ($parts === ['maintenance'] && $method === 'GET') {
        alchemize_json_response(['data' => $service->overview()], 200);
    }
    if ($parts === ['maintenance', 'overview'] && $method === 'POST') {
        alchemize_require_csrf();
        $payload = alchemize_read_json_request('POST');
        alchemize_json_response(['data' => $service->overview((int) ($payload['threshold_months'] ?? 6))], 200);
    }
    if ($parts === ['maintenance', 'preview'] && $method === 'POST') {
        alchemize_require_csrf();
        $payload = alchemize_read_json_request('POST');
        alchemize_json_response(['data' => $service->preview($payload)], 200);
    }
    if ($parts === ['maintenance', 'execute'] && $method === 'POST') {
        alchemize_require_csrf();
        $payload = alchemize_read_json_request('POST');
        alchemize_json_response(['data' => $service->execute($payload)], 200);
    }
    if ($parts === ['integrations'] && $method === 'GET') {
        $statusService = new AlchemizeSystemIntegrationsService($database, $config);
        alchemize_json_response(['data' => $statusService->summary()], 200);
    }
    if ($parts === ['integrations', 'check'] && $method === 'POST') {
        alchemize_require_csrf();
        $payload = alchemize_read_json_request('POST');
        $statusService = new AlchemizeSystemIntegrationsService($database, $config);
        alchemize_json_response(['data' => $statusService->healthCheck((string) ($payload['slug'] ?? ''))], 200);
    }
    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested settings route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Settings API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Settings are temporarily unavailable.');
}
