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
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Engagements API is temporarily unavailable.']]);
    exit;
}

$config = require $bootstrap;

try {
    $database = alchemize_database($config['database']);
    $repository = new AlchemizeEngagementRepository($database);
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
        $clientId = isset($payload['client_id']) && $payload['client_id'] !== '' ? (int) $payload['client_id'] : null;
        $serviceId = isset($payload['service_id']) && $payload['service_id'] !== '' ? (int) $payload['service_id'] : null;
        $catalog = new AlchemizeServiceRepository($database);
        $selectedService = $serviceId === null ? null : $catalog->findById($serviceId);
        if ($clientId === null || $selectedService === null || empty($selectedService['active_flag']) || in_array((string)($selectedService['catalog_status'] ?? ''), ['NOT_OFFERED','FUTURE_EXPANSION'], true)) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Client and an approved catalog service are required.');
        }
        $title = trim((string)($selectedService['public_name'] ?? $selectedService['service_name']));

        $publicId = alchemize_uuid_v4();
        $id = $repository->create([
            'public_id' => $publicId,
            'engagement_number' => trim((string) ($payload['engagement_number'] ?? 'ENG-' . $clientId . '-' . time())),
            'client_id' => $clientId,
            'service_id' => $serviceId,
            'title' => $title,
            'description' => trim((string) ($payload['description'] ?? '')) !== '' ? trim((string) ($payload['description'] ?? '')) : null,
            'status' => in_array((string) ($payload['status'] ?? 'preparing'), ['preparing','waiting_on_client','waiting_on_alchemize','scheduled','in_progress','review','ready_for_client','completed','archived'], true) ? (string) $payload['status'] : 'preparing',
            'start_date' => trim((string) ($payload['start_date'] ?? '')) !== '' ? trim((string) ($payload['start_date']) ) : null,
            'target_date' => trim((string) ($payload['target_date'] ?? '')) !== '' ? trim((string) ($payload['target_date']) ) : null,
            'completion_date' => trim((string) ($payload['completion_date'] ?? '')) !== '' ? trim((string) ($payload['completion_date']) ) : null,
            'owner_user_id' => isset($payload['owner_user_id']) && $payload['owner_user_id'] !== '' ? (int) $payload['owner_user_id'] : null,
            'billing_arrangement' => trim((string) ($payload['billing_arrangement'] ?? '')) !== '' ? trim((string) ($payload['billing_arrangement'] ?? '')) : null,
            'scope_notes' => trim((string) ($payload['scope_notes'] ?? '')) !== '' ? trim((string) ($payload['scope_notes'] ?? '')) : null,
            'pricing_notes' => trim((string) ($payload['pricing_notes'] ?? '')) !== '' ? trim((string) ($payload['pricing_notes'] ?? '')) : null,
        ]);

        $activities->create([
            'public_id' => alchemize_uuid_v4(), 'event_type' => 'admin.engagement.assigned',
            'actor_type' => 'staff', 'actor_user_id' => $actor['user_id'], 'entity_type' => 'engagement',
            'entity_id' => $publicId, 'client_id' => $clientId, 'engagement_id' => $id,
            'summary' => 'Alchemize assigned a service engagement.', 'visibility' => 'both',
        ]);

        alchemize_json_response(['data' => ['id' => $id, 'client_id' => $clientId, 'title' => $title]], 201);
    }

    if ($method === 'PUT' && count($parts) === 1 && ctype_digit((string) $parts[0])) {
        alchemize_require_staff_or_admin();
        alchemize_require_csrf();
        $id = (int) $parts[0];
        if ($repository->findById($id) === null) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Engagement was not found.');
        $payload = alchemize_read_json_request('PUT');
        $values = [];
        foreach (['title','description','start_date','target_date','completion_date','billing_arrangement'] as $field) {
            if (array_key_exists($field, $payload)) $values[$field] = trim((string) $payload[$field]) ?: null;
        }
        if (isset($payload['status']) && in_array($payload['status'], ['preparing','waiting_on_client','waiting_on_alchemize','scheduled','in_progress','review','ready_for_client','completed','archived'], true)) $values['status'] = $payload['status'];
        $repository->update($id, $values);
        alchemize_json_response(['data' => $repository->findById($id)], 200);
    }

    if ($method === 'GET' && count($parts) === 1 && ctype_digit((string) $parts[0])) {
        alchemize_require_read_only_or_higher();
        $id = (int) $parts[0];
        $engagement = $repository->findById($id);
        if ($engagement === null) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Engagement was not found.');
        }
        alchemize_json_response(['data' => $engagement], 200);
    }

    if ($method === 'GET' && count($parts) === 2 && ctype_digit((string) $parts[0]) && $parts[1] === 'document-types') {
        alchemize_require_read_only_or_higher();
        $engagement = $repository->findById((int)$parts[0]);
        if ($engagement === null) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Engagement was not found.');
        $serviceCode = (string)($engagement['service_code'] ?? '');
        $family = match ($serviceCode) {
            'website-design', 'website-maintenance', 'seo', 'digital-automation' => 'web_digital',
            'administrative-support', 'translation' => 'document_admin',
            default => null,
        };
        $types = [];
        $definition = $family === null ? null : (alchemize_intake_definitions()[$family] ?? null);
        foreach ((array)($definition['modules'] ?? []) as $module) {
            foreach ((array)($module['requirements'] ?? []) as $requirement) {
                if (in_array((string)($requirement['type'] ?? ''), ['document','asset'], true)) {
                    $types[] = ['value'=>(string)$requirement['key'],'label'=>(string)$requirement['name']];
                }
            }
        }
        alchemize_json_response(['data'=>['items'=>$types]],200);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested engagement route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Engagements API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Engagements API is temporarily unavailable.');
}
