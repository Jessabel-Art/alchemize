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
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Tasks API is temporarily unavailable.']]);
    exit;
}

$config = require $bootstrap;

try {
    $database = alchemize_database($config['database']);
    $repository = new AlchemizeTaskRepository($database);
    $activities = new AlchemizeActivityRepository($database);

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
        $title = trim((string) ($payload['title'] ?? ''));
        if ($title === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Task title is required.');
        }

        $publicId = alchemize_uuid_v4();
        $clientId = isset($payload['client_id']) && $payload['client_id'] !== '' ? (int) $payload['client_id'] : null;
        $engagementId = isset($payload['engagement_id']) && $payload['engagement_id'] !== '' ? (int) $payload['engagement_id'] : null;
        $id = $repository->create([
            'public_id' => $publicId,
            'client_id' => $clientId,
            'engagement_id' => $engagementId,
            'service_id' => isset($payload['service_id']) && $payload['service_id'] !== '' ? (int) $payload['service_id'] : null,
            'title' => $title,
            'description' => trim((string) ($payload['description'] ?? '')) !== '' ? trim((string) ($payload['description'] ?? '')) : null,
            'owner_user_id' => isset($payload['owner_user_id']) && $payload['owner_user_id'] !== '' ? (int) $payload['owner_user_id'] : null,
            'priority' => in_array((string) ($payload['priority'] ?? 'normal'), ['low','normal','high','urgent'], true) ? (string) $payload['priority'] : 'normal',
            'due_date' => trim((string) ($payload['due_date'] ?? '')) !== '' ? trim((string) ($payload['due_date']) ) : null,
            'status' => in_array((string) ($payload['status'] ?? 'not_started'), ['not_started','in_progress','waiting_on_client','waiting_on_alchemize','completed','archived'], true) ? (string) $payload['status'] : 'not_started',
            'visibility' => in_array((string) ($payload['visibility'] ?? 'admin'), ['admin','client','both'], true) ? (string) $payload['visibility'] : 'admin',
            'dependency_task_id' => isset($payload['dependency_task_id']) && $payload['dependency_task_id'] !== '' ? (int) $payload['dependency_task_id'] : null,
            'internal_notes' => trim((string) ($payload['internal_notes'] ?? '')) !== '' ? trim((string) ($payload['internal_notes'] ?? '')) : null,
        ]);
        if ($clientId !== null) $activities->create(['public_id'=>alchemize_uuid_v4(),'event_type'=>'admin.task.created','actor_type'=>'staff','actor_user_id'=>$actor['user_id'],'entity_type'=>'task','entity_id'=>$publicId,'client_id'=>$clientId,'engagement_id'=>$engagementId,'summary'=>'Alchemize assigned a client task.','visibility'=>(($payload['visibility'] ?? 'admin') === 'admin' ? 'admin' : 'both')]);

        alchemize_json_response(['data' => ['id' => $id, 'title' => $title]], 201);
    }

    if ($method === 'PUT' && count($parts) === 1 && ctype_digit((string) $parts[0])) {
        alchemize_require_staff_or_admin(); alchemize_require_csrf();
        $payload = alchemize_read_json_request('PUT'); $values=[];
        foreach(['title','description','due_date','visibility'] as $field) if(array_key_exists($field,$payload)) $values[$field]=trim((string)$payload[$field])?:null;
        if(isset($payload['status'])&&in_array($payload['status'],['not_started','in_progress','waiting_on_client','waiting_on_alchemize','completed','archived'],true))$values['status']=$payload['status'];
        if(isset($payload['priority'])&&in_array($payload['priority'],['low','normal','high','urgent'],true))$values['priority']=$payload['priority'];
        $repository->update((int)$parts[0],$values); alchemize_json_response(['data'=>['id'=>(int)$parts[0]]],200);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested task route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Tasks API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Tasks API is temporarily unavailable.');
}
