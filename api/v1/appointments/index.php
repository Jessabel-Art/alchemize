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
    $integrations = alchemize_external_integrations($database, $config);
    $notifications = new AlchemizeNotificationService(new AlchemizeNotificationRepository($database), alchemize_email_provider($config));

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

        $sync = $integrations->synchronizeAppointment($id);
        if (!empty($payload['client_id'])) $notifications->notifyClient((int) $payload['client_id'], 'admin.appointment.created', 'appointment', (string) $id, 'Appointment scheduled', 'An appointment was added to your client portal.', 'appointment-created:' . $id);
        alchemize_json_response(['data' => ['id' => $id, 'appointment_type' => $appointmentType, 'calendar_sync_status' => $sync['status']]], 201);
    }

    if (count($parts) === 1 && ctype_digit((string)$parts[0]) && $method === 'GET') {
        alchemize_require_read_only_or_higher(); $row=$repository->findById((int)$parts[0]);
        if($row===null)throw new AlchemizeRequestException(404,'NOT_FOUND','Appointment was not found.');
        alchemize_json_response(['data'=>$row],200);
    }
    if (count($parts) === 1 && ctype_digit((string)$parts[0]) && $method === 'PUT') {
        alchemize_require_staff_or_admin(); alchemize_require_csrf(); $id=(int)$parts[0];
        if($repository->findById($id)===null)throw new AlchemizeRequestException(404,'NOT_FOUND','Appointment was not found.');
        $payload=alchemize_read_json_request('PUT');$values=[];
        foreach(['appointment_type','scheduled_at','end_at','timezone','location_type','client_instructions','internal_notes'] as $field)if(array_key_exists($field,$payload))$values[$field]=trim((string)$payload[$field])?:null;
        foreach(['client_id','lead_id','engagement_id','service_id','owner_user_id','preparation_required','follow_up_required'] as $field)if(array_key_exists($field,$payload))$values[$field]=$payload[$field]===''?null:$payload[$field];
        if(isset($payload['status'])&&in_array($payload['status'],['requested','scheduled','confirmed','completed','cancelled'],true))$values['status']=$payload['status'];
        if(isset($payload['visibility'])&&in_array($payload['visibility'],['admin','client','both'],true))$values['visibility']=$payload['visibility'];
        if (array_key_exists('meeting_method', $payload) && trim((string) $payload['meeting_method']) !== '') { $values['meeting_method'] = trim((string) $payload['meeting_method']); }
        if (array_key_exists('meeting_url', $payload)) { $values['meeting_url'] = trim((string) $payload['meeting_url']) !== '' ? trim((string) $payload['meeting_url']) : null; }
        if (array_key_exists('location', $payload)) { $values['location'] = trim((string) $payload['location']) !== '' ? trim((string) $payload['location']) : null; }
        if (array_key_exists('duration_minutes', $payload)) { $values['duration_minutes'] = max(15, (int) $payload['duration_minutes']); }
        $repository->update($id,$values);$sync=$integrations->synchronizeAppointment($id);$row=$repository->findById($id);
        if (!empty($row['client_id'])) $notifications->notifyClient((int)$row['client_id'], 'admin.appointment.updated', 'appointment', (string)$id, 'Appointment updated', 'An appointment in your client portal was updated.', 'appointment-updated:' . $id . ':' . (string)($row['updated_at'] ?? microtime(true)));
        $row['calendar_sync_status']=$sync['status'];alchemize_json_response(['data'=>$row],200);
    }

    if ($method === 'GET' && $parts === ['availability']) {
        alchemize_require_read_only_or_higher();
        alchemize_json_response(['data' => $repository->listAvailability()], 200);
    }

    if ($method === 'POST' && $parts === ['availability']) {
        alchemize_require_staff_or_admin();
        alchemize_require_csrf();
        $payload = alchemize_read_json_request();
        $weekday = isset($payload['weekday']) ? (int) $payload['weekday'] : null;
        $startTime = trim((string) ($payload['start_time'] ?? ''));
        $endTime = trim((string) ($payload['end_time'] ?? ''));
        if ($startTime === '' || $endTime === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Availability start and end times are required.');
        }
        $id = $repository->createAvailability([
            'public_id' => alchemize_uuid_v4(),
            'user_id' => isset($payload['user_id']) && $payload['user_id'] !== '' ? (int) $payload['user_id'] : null,
            'weekday' => $weekday,
            'date_override' => isset($payload['date_override']) && trim((string) $payload['date_override']) !== '' ? trim((string) $payload['date_override']) : null,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'is_available' => !empty($payload['is_available']) ? 1 : 1,
            'kind' => trim((string) ($payload['kind'] ?? 'weekday')) !== '' ? trim((string) $payload['kind']) : 'weekday',
            'notes' => trim((string) ($payload['notes'] ?? '')) !== '' ? trim((string) $payload['notes']) : null,
            'created_by_user_id' => isset($payload['created_by_user_id']) && $payload['created_by_user_id'] !== '' ? (int) $payload['created_by_user_id'] : null,
        ]);
        alchemize_json_response(['data' => ['id' => $id, 'created' => true]], 201);
    }

    if ($method === 'POST' && $parts === ['scheduling-links']) {
        alchemize_require_staff_or_admin();
        alchemize_require_csrf();
        $payload = alchemize_read_json_request();
        $appointmentType = trim((string) ($payload['appointment_type'] ?? 'Consultation'));
        $recipientEmail = trim((string) ($payload['recipient_email'] ?? ''));
        if ($appointmentType === '' || $recipientEmail === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Appointment type and recipient email are required.');
        }
        $expiresAt = isset($payload['expires_at']) && trim((string) $payload['expires_at']) !== '' ? trim((string) $payload['expires_at']) : date('Y-m-d H:i:s', time() + 86400);
        $token = $repository->createSchedulingLink([
            'public_id' => alchemize_uuid_v4(),
            'client_id' => isset($payload['client_id']) && $payload['client_id'] !== '' ? (int) $payload['client_id'] : null,
            'lead_id' => isset($payload['lead_id']) && $payload['lead_id'] !== '' ? (int) $payload['lead_id'] : null,
            'appointment_type' => $appointmentType,
            'meeting_method' => trim((string) ($payload['meeting_method'] ?? 'phone')) !== '' ? trim((string) $payload['meeting_method']) : 'phone',
            'expires_at' => $expiresAt,
            'created_by_user_id' => isset($payload['created_by_user_id']) && $payload['created_by_user_id'] !== '' ? (int) $payload['created_by_user_id'] : null,
            'recipient_name' => trim((string) ($payload['recipient_name'] ?? '')) !== '' ? trim((string) $payload['recipient_name']) : null,
            'recipient_email' => $recipientEmail,
            'notes' => trim((string) ($payload['notes'] ?? '')) !== '' ? trim((string) $payload['notes']) : null,
        ]);
        $baseUrl = trim((string) ($_SERVER['APP_URL'] ?? $_SERVER['HTTP_ORIGIN'] ?? 'https://localhost'));
        $baseUrl = rtrim($baseUrl, '/');
        alchemize_json_response(['data' => ['token' => $token, 'url' => $baseUrl . '/appointment/schedule/' . $token, 'expires_at' => $expiresAt]], 201);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested appointment route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Appointments API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Appointments API is temporarily unavailable.');
}
