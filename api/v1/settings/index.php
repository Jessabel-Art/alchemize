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
    $repository = new AlchemizeSettingsRepository(alchemize_database($config['database']));
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $parts = array_values(array_filter(explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'))));
    if ($parts === [] && $method === 'GET') {
        alchemize_json_response(['data' => $repository->all()], 200);
    }
    if ($parts === [] && $method === 'PUT') {
        alchemize_require_csrf();
        $payload = alchemize_read_json_request('PUT');
        $allowed = ['business_name','business_email','timezone','appointment_default_duration','portal_message_email_notifications'];
        $values = array_intersect_key($payload, array_flip($allowed));
        if (isset($values['business_email']) && $values['business_email'] !== '' && !filter_var($values['business_email'], FILTER_VALIDATE_EMAIL)) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Enter a valid business email address.');
        }
        if (isset($values['appointment_default_duration'])) {
            $values['appointment_default_duration'] = max(15, min(480, (int) $values['appointment_default_duration']));
        }
        if (isset($values['timezone']) && !in_array($values['timezone'], timezone_identifiers_list(), true)) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a valid timezone.');
        }
        alchemize_json_response(['data' => $repository->update($values, (int) $user['user_id'])], 200);
    }
    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested settings route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Settings API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Settings are temporarily unavailable.');
}
