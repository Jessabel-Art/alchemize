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
    echo json_encode(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Appointments API is temporarily unavailable.']]);
    exit;
}

$config = require $bootstrap;

try {
    $database = alchemize_database($config['database']);
    $repository = new AlchemizeAppointmentRepository($database);

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = trim($_SERVER['PATH_INFO'] ?? ($_SERVER['REQUEST_URI'] ?? ''), '/');
    $parts = array_values(array_filter(explode('/', $path), static fn (string $value): bool => $value !== ''));

    if ($method === 'GET' && $parts === []) {
        alchemize_require_read_only_or_higher();
        alchemize_json_response(['data' => $repository->listAll()], 200);
    }

    if ($method === 'POST' && $parts === []) {
        alchemize_require_staff_or_admin();
        alchemize_require_csrf();
        $payload = alchemize_read_json_request();
        $appointmentType = trim((string) ($payload['appointment_type'] ?? ''));
        $scheduledAt = trim((string) ($payload['scheduled_at'] ?? ''));
        if ($appointmentType === '' || $scheduledAt === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Appointment type and scheduled time are required.');
        }

        $id = $repository->create([
            'public_id' => alchemize_uuid_v4(),
            'client_id' => isset($payload['client_id']) && $payload['client_id'] !== '' ? (int) $payload['client_id'] : null,
            'lead_id' => isset($payload['lead_id']) && $payload['lead_id'] !== '' ? (int) $payload['lead_id'] : null,
            'engagement_id' => isset($payload['engagement_id']) && $payload['engagement_id'] !== '' ? (int) $payload['engagement_id'] : null,
            'appointment_type' => $appointmentType,
            'service_id' => isset($payload['service_id']) && $payload['service_id'] !== '' ? (int) $payload['service_id'] : null,
            'scheduled_at' => $scheduledAt,
            'end_at' => trim((string) ($payload['end_at'] ?? '')) !== '' ? trim((string) ($payload['end_at'])) : null,
            'timezone' => trim((string) ($payload['timezone'] ?? 'UTC')) !== '' ? trim((string) ($payload['timezone'])) : 'UTC',
            'location_type' => trim((string) ($payload['location_type'] ?? '')) !== '' ? trim((string) ($payload['location_type'])) : null,
            'status' => in_array((string) ($payload['status'] ?? 'requested'), ['requested','scheduled','confirmed','completed','cancelled'], true) ? (string) $payload['status'] : 'requested',
            'visibility' => in_array((string) ($payload['visibility'] ?? 'admin'), ['admin','client','both'], true) ? (string) $payload['visibility'] : 'admin',
            'client_instructions' => trim((string) ($payload['client_instructions'] ?? '')) !== '' ? trim((string) $payload['client_instructions']) : null,
            'preparation_required' => !empty($payload['preparation_required']) ? 1 : 0,
            'follow_up_required' => !empty($payload['follow_up_required']) ? 1 : 0,
            'internal_notes' => trim((string) ($payload['internal_notes'] ?? '')) !== '' ? trim((string) ($payload['internal_notes'])) : null,
            'owner_user_id' => isset($payload['owner_user_id']) && $payload['owner_user_id'] !== '' ? (int) $payload['owner_user_id'] : null,
        ]);

        alchemize_json_response(['data' => ['id' => $id, 'appointment_type' => $appointmentType]], 201);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested appointment route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Appointments API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Appointments API is temporarily unavailable.');
}
