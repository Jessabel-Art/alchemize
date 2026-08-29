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
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Services API is temporarily unavailable.']]);
    exit;
}

$config = require $bootstrap;

try {
    $database = alchemize_database($config['database']);
    $repository = new AlchemizeServiceRepository($database);

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = trim($_SERVER['PATH_INFO'] ?? ($_SERVER['REQUEST_URI'] ?? ''), '/');
    $parts = array_values(array_filter(explode('/', $path), static fn (string $value): bool => $value !== ''));

    if ($method === 'GET' && $parts === ['public']) {
        header('Cache-Control: public, max-age=300, stale-while-revalidate=3600');
        alchemize_json_response(['data' => $repository->listPublic()], 200);
    }

    if ($method === 'GET' && $parts === []) {
        alchemize_require_read_only_or_higher();
        alchemize_json_response(['data' => $repository->listAll()], 200);
    }

    if ($method === 'POST' && $parts === []) {
        alchemize_require_staff_or_admin();
        alchemize_require_csrf();
        $payload = alchemize_read_json_request();
        $serviceCode = trim((string) ($payload['service_code'] ?? ''));
        $serviceName = trim((string) ($payload['service_name'] ?? ''));
        if ($serviceCode === '' || $serviceName === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Service code and name are required.');
        }

        $id = $repository->create([
            'public_id' => alchemize_uuid_v4(),
            'service_code' => $serviceCode,
            'service_name' => $serviceName,
            'description' => trim((string) ($payload['description'] ?? '')) !== '' ? trim((string) ($payload['description'] ?? '')) : null,
            'audience' => in_array((string) ($payload['audience'] ?? 'all'), ['individual', 'business', 'all'], true) ? (string) $payload['audience'] : 'all',
            'category' => trim((string) ($payload['category'] ?? '')) !== '' ? trim((string) ($payload['category'] ?? '')) : null,
            'status' => in_array((string) ($payload['status'] ?? 'active'), ['draft', 'active', 'retired', 'archived'], true) ? (string) $payload['status'] : 'active',
            'default_duration' => isset($payload['default_duration']) && $payload['default_duration'] !== '' ? (int) $payload['default_duration'] : null,
            'billing_type' => trim((string) ($payload['billing_type'] ?? '')) !== '' ? trim((string) ($payload['billing_type'] ?? '')) : null,
            'default_price' => isset($payload['default_price']) && $payload['default_price'] !== '' ? (string) $payload['default_price'] : null,
            'currency' => trim((string) ($payload['currency'] ?? 'USD')) !== '' ? strtoupper(trim((string) $payload['currency'])) : 'USD',
            'active_flag' => isset($payload['active_flag']) ? (bool) $payload['active_flag'] : true,
            'billing_description' => trim((string) ($payload['billing_description'] ?? '')) !== '' ? trim((string) ($payload['billing_description'] ?? '')) : null,
            'internal_pricing_notes' => trim((string) ($payload['internal_pricing_notes'] ?? '')) !== '' ? trim((string) ($payload['internal_pricing_notes'] ?? '')) : null,
        ]);

        alchemize_json_response(['data' => ['id' => $id, 'service_code' => $serviceCode, 'service_name' => $serviceName]], 201);
    }

    if ($method === 'GET' && count($parts) === 1 && ctype_digit((string) $parts[0])) {
        alchemize_require_read_only_or_higher();
        $id = (int) $parts[0];
        $service = $repository->findById($id);
        if ($service === null) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Service was not found.');
        }
        alchemize_json_response(['data' => $service], 200);
    }

    if ($method === 'POST' && count($parts) === 2 && ctype_digit((string) $parts[0]) && $parts[1] === 'calculate') {
        alchemize_require_staff_or_admin();
        alchemize_require_csrf();
        $payload = alchemize_read_json_request();
        $tierId = isset($payload['tier_id']) && $payload['tier_id'] !== '' ? (int) $payload['tier_id'] : null;
        alchemize_json_response(['data' => $repository->calculate((int) $parts[0], $tierId, (array) ($payload['inputs'] ?? []))], 200);
    }

    if ($method === 'PUT' && count($parts) === 1 && ctype_digit((string) $parts[0])) {
        alchemize_require_staff_or_admin(); alchemize_require_csrf();
        $id = (int) $parts[0]; if ($repository->findById($id) === null) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Service was not found.');
        $payload = alchemize_read_json_request('PUT'); $values = [];
        foreach (['service_code','service_name','description','category','billing_type','billing_description','internal_pricing_notes'] as $field) if (array_key_exists($field,$payload)) $values[$field]=trim((string)$payload[$field])?:null;
        foreach (['default_duration','default_price','active_flag'] as $field) if (array_key_exists($field,$payload)) $values[$field]=$payload[$field] === '' ? null : $payload[$field];
        if (isset($payload['audience']) && in_array($payload['audience'],['individual','business','all'],true)) $values['audience']=$payload['audience'];
        if (isset($payload['status']) && in_array($payload['status'],['draft','active','retired','archived'],true)) $values['status']=$payload['status'];
        $repository->update($id,$values); alchemize_json_response(['data'=>$repository->findById($id)],200);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested service route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Services API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Services API is temporarily unavailable.');
}
