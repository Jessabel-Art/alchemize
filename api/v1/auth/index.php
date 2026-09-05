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
    error_log('Auth endpoint bootstrap unavailable: no configured bootstrap file was found.');
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Authentication is temporarily unavailable.']]);
    exit;
}

$bootstrapPath = getenv('ALCHEMIZE_SERVER_BOOTSTRAP') ?: $bootstrap;
try {
    $config = require $bootstrapPath;
} catch (Throwable $error) {
    error_log(sprintf('Auth endpoint bootstrap failure [%s].', get_class($error)));
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Authentication is temporarily unavailable.']]);
    exit;
}
$serverRoot = dirname($bootstrapPath);

$authStage = 'dependencies';
try {
    require_once $serverRoot . '/auth/session.php';
    require_once $serverRoot . '/repositories/role-repository.php';
    require_once $serverRoot . '/repositories/user-repository.php';
    require_once $serverRoot . '/services/auth-service.php';

    $authStage = 'configuration';
    $appConfig = alchemize_config();
    $authStage = 'database';
    $database = alchemize_database($appConfig['database']);
    $authStage = 'repositories';
    $auth = new AlchemizeAuthService(
        new AlchemizeUserRepository($database),
        new AlchemizeRoleRepository($database),
    );
    $accountService = new AlchemizePortalAccountService(
        $database,
        new AlchemizeUserRepository($database),
        new AlchemizeRoleRepository($database),
        new AlchemizePortalAccountRepository($database),
        $appConfig,
    );

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = trim($_SERVER['PATH_INFO'] ?? ($_SERVER['REQUEST_URI'] ?? ''), '/');
    $parts = array_values(array_filter(explode('/', $path), static fn (string $value): bool => $value !== ''));

    if ($method === 'GET' && $parts === ['session']) {
        $authStage = 'session';
        $user = alchemize_session_user();
        $csrfToken = alchemize_csrf_token();
        alchemize_json_response([
            'data' => [
                'authenticated' => is_array($user) && !empty($user['user_id']),
                'user' => $user,
                'csrf_token' => $csrfToken,
            ],
        ], 200);
    }

    if ($method === 'POST' && $parts === ['login']) {
        $authStage = 'request';
        $payload = alchemize_read_json_request();
        $email = trim((string) ($payload['email'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        if ($email === '' || $password === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Email and password are required.');
        }

        $authStage = 'credentials';
        $sessionUser = $auth->login($email, $password);
        $authStage = 'session';
        alchemize_set_session_user($sessionUser);
        alchemize_json_response([
            'data' => [
                'authenticated' => true,
                'user' => $sessionUser,
                'csrf_token' => alchemize_csrf_token(),
            ],
        ], 200);
    }

    if ($method === 'POST' && $parts === ['set-password']) {
        $payload = alchemize_read_json_request();
        $accountService->setPassword(
            (string) ($payload['token'] ?? ''),
            (string) ($payload['purpose'] ?? 'invitation'),
            (string) ($payload['password'] ?? '')
        );
        alchemize_json_response(['data' => ['completed' => true]], 200);
    }

    if ($method === 'POST' && $parts === ['forgot-password']) {
        $payload = alchemize_read_json_request();
        $accountService->requestPasswordReset((string) ($payload['email'] ?? ''));
        alchemize_json_response(['data' => ['accepted' => true, 'message' => 'If the account is eligible, password reset instructions will be sent.']], 202);
    }

    if ($method === 'POST' && $parts === ['change-password']) {
        $user = alchemize_require_authenticated_user(); alchemize_require_csrf();
        $payload = alchemize_read_json_request();
        $accountService->changePassword((int) $user['user_id'], (string) ($payload['current_password'] ?? ''), (string) ($payload['new_password'] ?? ''));
        (new AlchemizeAuditEventRepository($database))->create([
            'public_id'=>alchemize_uuid_v4(),'actor_user_id'=>$user['user_id'],'event_type'=>'portal.password.changed',
            'entity_type'=>'user','entity_id'=>(string)$user['public_id'],'action_summary'=>'Portal user changed their password.','request_metadata'=>null,
        ]);
        alchemize_json_response(['data' => ['changed' => true]], 200);
    }

    if ($method === 'POST' && $parts === ['logout']) {
        alchemize_clear_session_user();
        alchemize_json_response([
            'data' => ['authenticated' => false, 'csrf_token' => ''],
        ], 200);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested authentication route was not found.');
} catch (AlchemizeRequestException $error) {
    if ($error->httpStatus === 405) {
        header('Allow: GET, POST');
    }
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Auth endpoint failure at %s [%s].', $authStage, get_class($error)));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Authentication is temporarily unavailable.');
}
