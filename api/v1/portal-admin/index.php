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
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Portal administration is temporarily unavailable.']]); exit;
}
$config = require $bootstrap;

try {
    $user = alchemize_require_staff_or_admin();
    $database = alchemize_database($config['database']);
    $service = new AlchemizePortalAdminService(
        new AlchemizePortalAdminRepository($database),
        new AlchemizeActivityRepository($database),
        new AlchemizeAuditEventRepository($database),
        new AlchemizeNotificationService(new AlchemizeNotificationRepository($database), alchemize_email_provider($config)),
    );
    $repository = new AlchemizePortalAdminRepository($database);
    $intakes = new AlchemizeIntakeAdminService(new AlchemizeIntakeRepository($database), new AlchemizeActivityRepository($database));
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $parts = array_values(array_filter(explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'))));
    if ($method === 'GET' && $parts === ['attention']) {
        alchemize_json_response(['data' => $service->attention()], 200);
    }
    if ($method === 'GET' && $parts === ['messages']) {
        alchemize_json_response(['data' => $service->threads()], 200);
    }
    if ($method === 'GET' && $parts === ['intakes']) {
        alchemize_json_response(['data' => $intakes->list()], 200);
    }
    if ($method === 'GET' && count($parts) === 2 && $parts[0] === 'intakes') {
        alchemize_json_response(['data' => $intakes->get($parts[1])], 200);
    }
    if ($method === 'GET' && count($parts) === 2 && $parts[0] === 'messages') {
        alchemize_json_response(['data' => $service->thread($parts[1])], 200);
    }
    if ($method === 'GET' && count($parts) === 3 && $parts[0] === 'documents' && $parts[2] === 'download') {
        $submission = $repository->findSubmission($parts[1], false);
        if ($submission === null) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested document was not found.');
        (new AlchemizeDocumentStorageService((string) $config['document_storage_root']))->sendPrivateFile(
            (string) $submission['storage_key'],
            (string) $submission['original_filename'],
            (string) $submission['mime_type'],
        );
    }
    if ($method === 'GET' && count($parts) === 3 && $parts[0] === 'documents' && $parts[2] === 'versions') {
        alchemize_json_response(['data' => ['items' => $repository->listDocumentVersions($parts[1])]], 200);
    }
    if ($method === 'POST' && count($parts) === 4 && $parts[0] === 'resolve') {
        alchemize_require_csrf();
        $payload = alchemize_read_json_request();
        alchemize_json_response(['data' => $service->resolve($parts[1], $parts[2], $parts[3], $user, $payload)], 200);
    }
    if ($method === 'POST' && count($parts) === 3 && $parts[0] === 'messages' && $parts[2] === 'reply') {
        alchemize_require_csrf();
        alchemize_json_response(['data' => $service->reply($parts[1], $user, alchemize_read_json_request())], 201);
    }
    if ($method === 'POST' && $parts === ['intakes']) {
        alchemize_require_csrf();
        alchemize_json_response(['data' => $intakes->assign($user, alchemize_read_json_request())], 201);
    }
    if ($method === 'PUT' && count($parts) === 2 && $parts[0] === 'intakes') {
        alchemize_require_csrf();
        alchemize_json_response(['data' => $intakes->review($parts[1], $user, alchemize_read_json_request())], 200);
    }
    if($method==='POST'&&count($parts)===5&&$parts[0]==='intakes'&&$parts[2]==='requirements'){
        alchemize_require_csrf();alchemize_json_response(['data'=>$intakes->reviewRequirement($parts[1],$parts[3],$parts[4],$user,alchemize_read_json_request())],200);
    }
    if ($method === 'POST' && count($parts) === 3 && $parts[0] === 'messages' && $parts[2] === 'link') {
        alchemize_require_csrf();
        alchemize_json_response(['data' => $service->linkThread($parts[1], alchemize_read_json_request())], 200);
    }
    if ($method === 'PUT' && count($parts) === 2 && $parts[0] === 'messages') {
        alchemize_require_csrf();
        alchemize_json_response(['data' => $service->updateThread($parts[1], $user, alchemize_read_json_request())], 200);
    }
    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested portal administration route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Portal administration failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Portal administration is temporarily unavailable.');
}
