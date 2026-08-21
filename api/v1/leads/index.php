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
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode([
        'error' => ['code' => 'INTERNAL_ERROR', 'message' => 'The leads API is temporarily unavailable.'],
    ]);
    exit;
}

$config = require $bootstrap;

try {
    $database = alchemize_database($config['database']);
    $leadRepository = new AlchemizeLeadRepository($database);
    $activityRepository = new AlchemizeActivityRepository($database);
    $attemptRepository = new AlchemizeLeadContactAttemptRepository($database);
    $interestRepository = new AlchemizeLeadInterestRepository($database);
    $noteRepository = new AlchemizeNoteRepository($database);
    $clientRepository = new AlchemizeClientRepository($database);
    $auditRepository = new AlchemizeAuditEventRepository($database);

    $leadService = new AlchemizeLeadService($database, $leadRepository, $activityRepository);
    $leadAdminService = new AlchemizeLeadAdminService(
        $leadRepository,
        $activityRepository,
        $auditRepository,
        $attemptRepository,
        $interestRepository,
        $noteRepository,
        $clientRepository,
    );

    $sessionUser = alchemize_session_user();
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = trim($_SERVER['PATH_INFO'] ?? ($_SERVER['REQUEST_URI'] ?? ''), '/');
    $parts = array_values(array_filter(explode('/', $path), static fn (string $value): bool => $value !== ''));

    if ($method === 'POST' && $parts === []) {
        $payload = alchemize_read_json_request();
        $validation = alchemize_validate_lead($payload);
        if ($validation['spam']) {
            alchemize_json_response(['data' => ['leadId' => alchemize_uuid_v4(), 'status' => 'new']], 201);
        }
        if (!$validation['valid']) {
            alchemize_error_response(422, 'VALIDATION_ERROR', 'Please review the highlighted fields and try again.', $validation['errors']);
        }
        alchemize_json_response(['data' => $leadService->create($validation['data'])], 201);
    }

    if (!is_array($sessionUser) || empty($sessionUser['user_id'])) {
        throw new AlchemizeRequestException(401, 'UNAUTHORIZED', 'Authentication required.');
    }

    if ($method === 'GET' && $parts === []) {
        alchemize_json_response(['data' => $leadAdminService->listLeads()], 200);
    }

    if ($method === 'GET' && count($parts) === 1 && ctype_digit((string) $parts[0])) {
        alchemize_json_response(['data' => $leadAdminService->getLead((int) $parts[0])], 200);
    }

    if ($method === 'PUT' && count($parts) === 1 && ctype_digit((string) $parts[0])) {
        $payload = alchemize_read_json_request();
        alchemize_require_csrf();
        alchemize_json_response(['data' => $leadAdminService->updateLead((int) $parts[0], $payload)], 200);
    }

    if ($method === 'POST' && count($parts) === 2 && ctype_digit((string) $parts[0]) && $parts[1] === 'convert') {
        $payload = alchemize_read_json_request();
        alchemize_require_csrf();
        alchemize_json_response(['data' => $leadAdminService->convertLead((int) $parts[0], $payload, (int) $sessionUser['user_id'])], 200);
    }

    if ($method === 'POST' && count($parts) === 2 && ctype_digit((string) $parts[0]) && $parts[1] === 'contact-attempts') {
        $payload = alchemize_read_json_request();
        alchemize_require_csrf();
        alchemize_json_response(['data' => $leadAdminService->addContactAttempt((int) $parts[0], $payload, (int) $sessionUser['user_id'])], 201);
    }

    if ($method === 'POST' && count($parts) === 2 && ctype_digit((string) $parts[0]) && $parts[1] === 'notes') {
        $payload = alchemize_read_json_request();
        alchemize_require_csrf();
        alchemize_json_response(['data' => $leadAdminService->addNote((int) $parts[0], $payload, (int) $sessionUser['user_id'])], 201);
    }

    if ($method === 'POST' && count($parts) === 2 && ctype_digit((string) $parts[0]) && $parts[1] === 'interests') {
        $payload = alchemize_read_json_request();
        alchemize_require_csrf();
        alchemize_json_response(['data' => $leadAdminService->addInterest((int) $parts[0], $payload)], 201);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested lead route was not found.');
} catch (AlchemizeRequestException $error) {
    if ($error->httpStatus === 405) {
        header('Allow: GET, POST, PUT');
    }
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Lead API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'The leads API is temporarily unavailable.');
}
