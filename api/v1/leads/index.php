<?php

declare(strict_types=1);

// Keep bootstrap failures out of public responses even before application config loads.
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
    error_log('Lead endpoint bootstrap file was not found.');
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode([
        'error' => [
            'code' => 'INTERNAL_ERROR',
            'message' => 'We could not submit your request. Please try again later.',
        ],
    ]);
    exit;
}

$config = require $bootstrap;

try {
    $payload = alchemize_read_json_request();
    $validation = alchemize_validate_lead($payload);

    // Honeypot submissions receive a neutral success without touching the database.
    if ($validation['spam']) {
        alchemize_json_response([
            'data' => ['leadId' => alchemize_uuid_v4(), 'status' => 'new'],
        ], 201);
    }

    if (!$validation['valid']) {
        alchemize_error_response(
            422,
            'VALIDATION_ERROR',
            'Please review the highlighted fields and try again.',
            $validation['errors'],
        );
    }

    $database = alchemize_database($config['database']);
    $service = new AlchemizeLeadService(
        $database,
        new AlchemizeLeadRepository($database),
        new AlchemizeActivityRepository($database),
    );
    alchemize_json_response(['data' => $service->create($validation['data'])], 201);
} catch (AlchemizeRequestException $error) {
    if ($error->httpStatus === 405) {
        header('Allow: POST');
    }
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Lead endpoint failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(
        500,
        'INTERNAL_ERROR',
        'We could not submit your request. Please try again later.',
    );
}
