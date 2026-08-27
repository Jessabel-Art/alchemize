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
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Client API is temporarily unavailable.']]);
    exit;
}

$config = require $bootstrap;

try {
    $database = alchemize_database($config['database']);
    $repository = new AlchemizeClientRepository($database);
    $activityRepo = new AlchemizeActivityRepository($database);
    $service = new AlchemizeClientService($repository, $activityRepo);
    $userRepository = new AlchemizeUserRepository($database);
    $accountRepository = new AlchemizePortalAccountRepository($database);
    $accountService = new AlchemizePortalAccountService(
        $database, $userRepository, new AlchemizeRoleRepository($database), $accountRepository, $config
    );

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = trim($_SERVER['PATH_INFO'] ?? ($_SERVER['REQUEST_URI'] ?? ''), '/');
    $parts = array_values(array_filter(explode('/', $path), static fn (string $value): bool => $value !== ''));

    if ($method === 'GET' && $parts === []) {
        alchemize_require_read_only_or_higher();
        alchemize_json_response(['data' => $repository->listAll()], 200);
    }

    if ($method === 'POST' && $parts === []) {
        $actor = alchemize_require_staff_or_admin();
        alchemize_require_csrf();
        $payload = alchemize_read_json_request();
        $database->beginTransaction();
        try {
            $data = $service->create($payload);
            $email = trim((string) ($payload['primary_email'] ?? ''));
            if ($email !== '' && ($payload['portal_access_requested'] ?? true) !== false) {
                $data['portal'] = $accountService->provision(
                    (int) $data['id'], $email, (string) $data['display_name'], (int) ($actor['user_id'] ?? 0) ?: null
                );
            }
            $database->commit();
        } catch (Throwable $error) {
            if ($database->inTransaction()) $database->rollBack();
            throw $error;
        }
        $data['drive'] = alchemize_external_integrations($database, $config)->ensureClientFolder((int) $data['id']);
        $delivery = $data['portal']['email_delivery'] ?? null;
        $data['message'] = $delivery !== null && $delivery !== 'sent'
            ? 'Client created successfully. The invitation email could not be delivered.'
            : 'Client created successfully.';
        alchemize_json_response(['data' => $data], 201);
    }

    if ($method === 'POST' && count($parts) === 2 && ctype_digit((string) $parts[0]) && $parts[1] === 'drive-sync') {
        alchemize_require_admin(); alchemize_require_csrf();
        alchemize_json_response(['data' => alchemize_external_integrations($database, $config)->ensureClientFolder((int) $parts[0])], 200);
    }

    if ($method === 'GET' && $parts === ['team']) {
        alchemize_require_admin();
        alchemize_json_response(['data' => $userRepository->listInternalUsers()], 200);
    }

    if ($method === 'GET' && count($parts) === 2 && ctype_digit((string) $parts[0]) && $parts[1] === 'portal-account') {
        alchemize_require_read_only_or_higher();
        $status = $accountRepository->statusForClient((int) $parts[0]);
        if ($status === null) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Client was not found.');
        unset($status['password_hash']);
        $status['password_set'] = ($status['user_status'] ?? null) === 'active';
        alchemize_json_response(['data' => $status], 200);
    }

    if ($method === 'POST' && count($parts) === 2 && ctype_digit((string) $parts[0])
        && in_array($parts[1], ['portal-invitation', 'password-reset'], true)) {
        $actor = alchemize_require_admin();
        alchemize_require_csrf();
        $purpose = $parts[1] === 'portal-invitation' ? 'invitation' : 'password_reset';
        $data = $accountService->issueForClient((int) $parts[0], $purpose, (int) ($actor['user_id'] ?? 0) ?: null);
        alchemize_json_response(['data' => $data], 200);
    }

    if ($method === 'POST' && count($parts) === 2 && ctype_digit((string) $parts[0])
        && in_array($parts[1], ['setup-link', 'password-reset-link'], true)) {
        $actor = alchemize_require_admin();
        alchemize_require_csrf();
        $purpose = $parts[1] === 'setup-link' ? 'invitation' : 'password_reset';
        alchemize_json_response(['data' => $accountService->manualLinkForClient(
            (int) $parts[0], $purpose, (int) ($actor['user_id'] ?? 0) ?: null
        )], 200);
    }

    if ($method === 'POST' && count($parts) === 2 && ctype_digit((string) $parts[0]) && $parts[1] === 'portal-access') {
        $actor = alchemize_require_admin(); alchemize_require_csrf();
        $client = $repository->findById((int) $parts[0]);
        if ($client === null) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Client was not found.');
        alchemize_json_response(['data' => $accountService->provision(
            (int) $client['id'], (string) $client['primary_email'], (string) $client['display_name'], (int) ($actor['user_id'] ?? 0) ?: null
        )], 201);
    }

    if ($method === 'POST' && count($parts) === 2 && ctype_digit((string) $parts[0])
        && in_array($parts[1], ['disable-portal', 'enable-portal'], true)) {
        alchemize_require_admin(); alchemize_require_csrf();
        alchemize_json_response(['data' => $accountService->setAccessState((int) $parts[0], $parts[1] === 'enable-portal')], 200);
    }

    if ($method === 'PUT' && count($parts) === 1 && ctype_digit((string) $parts[0])) {
        alchemize_require_staff_or_admin(); alchemize_require_csrf();
        alchemize_json_response(['data' => $service->update((int) $parts[0], alchemize_read_json_request('PUT'))], 200);
    }

    if ($method === 'GET' && count($parts) === 1 && ctype_digit((string) $parts[0])) {
        alchemize_require_read_only_or_higher();
        $id = (int) $parts[0];
        $client = $repository->findById($id);
        if ($client === null) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Client was not found.');
        }
        alchemize_json_response(['data' => $client], 200);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested client route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Client API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Client API is temporarily unavailable.');
}
