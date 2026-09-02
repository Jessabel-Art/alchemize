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
    $scheduler = new AlchemizeAppointmentSchedulingService($repository, (string) ($config['app_timezone'] ?? 'America/New_York'));

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = trim($_SERVER['PATH_INFO'] ?? ($_SERVER['REQUEST_URI'] ?? ''), '/');
    $parts = array_values(array_filter(explode('/', $path), static fn (string $value): bool => $value !== ''));

    if ($method === 'GET' && count($parts) === 2 && $parts[0] === 'scheduling-links') {
        $link = $repository->findSchedulingLink((string) $parts[1]);
        if ($link === null) throw new AlchemizeRequestException(404, 'INVALID_SCHEDULING_LINK', 'This scheduling link is invalid, expired, revoked, or no longer available.');
        alchemize_json_response(['data' => $scheduler->publicContext($link)], 200);
    }

    if ($method === 'GET' && count($parts) === 3 && $parts[0] === 'scheduling-links' && $parts[2] === 'availability') {
        $link = $repository->findSchedulingLink((string) $parts[1]);
        if ($link === null) throw new AlchemizeRequestException(404, 'INVALID_SCHEDULING_LINK', 'This scheduling link is invalid, expired, revoked, or no longer available.');
        $date = trim((string) ($_GET['date'] ?? ''));
        $busy = $integrations->appointmentBusyPeriods($date, (string) $link['timezone']);
        alchemize_json_response(['data' => ['date' => $date, 'timezone' => $link['timezone'], 'slots' => $scheduler->slots($link, $date, $busy)]], 200);
    }

    if ($method === 'POST' && count($parts) === 3 && $parts[0] === 'scheduling-links' && $parts[2] === 'book') {
        $token = (string) $parts[1];
        $link = $repository->findSchedulingLink($token);
        if ($link === null) throw new AlchemizeRequestException(404, 'INVALID_SCHEDULING_LINK', 'This scheduling link is invalid, expired, revoked, or no longer available.');
        $payload = alchemize_read_json_request();
        $slot = $scheduler->requireAvailable($link, trim((string) ($payload['selected_start'] ?? '')));
        $database->beginTransaction();
        try {
            $link = $repository->findSchedulingLink($token);
            if ($link === null) throw new AlchemizeRequestException(409, 'SLOT_UNAVAILABLE', 'That time is no longer available. Please select another time.');
            $slot = $scheduler->requireAvailable($link, (string) $slot['start']);
            $appointment = [
                'public_id' => alchemize_uuid_v4(), 'client_id' => $link['client_id'], 'lead_id' => $link['lead_id'],
                'appointment_type' => $link['appointment_type'], 'service_id' => $link['service_id'],
                'scheduled_at' => (new DateTimeImmutable($slot['start']))->format('Y-m-d H:i:s'),
                'end_at' => (new DateTimeImmutable($slot['end']))->format('Y-m-d H:i:s'),
                'timezone' => $link['timezone'], 'location_type' => $link['meeting_method'],
                'meeting_method' => $link['meeting_method'], 'location' => $link['location'],
                'duration_minutes' => $link['duration_minutes'], 'status' => 'confirmed',
                'visibility' => $link['client_id'] !== null ? 'both' : 'admin',
                'client_instructions' => trim((string) ($payload['note'] ?? '')) ?: null,
                'source' => 'public_scheduling_link', 'scheduling_link_id' => $link['id'],
                'scheduling_context' => json_encode([
                    'recipient_name' => trim((string) ($payload['name'] ?? $link['recipient_name'])),
                    'recipient_email' => trim((string) ($payload['email'] ?? $link['recipient_email'])),
                    'recipient_phone' => trim((string) ($payload['phone'] ?? $link['recipient_phone'])),
                ], JSON_THROW_ON_ERROR),
            ];
            $id = $repository->create($appointment);
            $repository->markSchedulingLinkUsed((int) $link['id']);
            $repository->recordAppointmentEvents($id, $appointment, 'appointment.public_booked', 'Appointment booked through a public scheduling link.');
            $database->commit();
        } catch (Throwable $error) {
            if ($database->inTransaction()) $database->rollBack();
            throw $error;
        }
        $sync = $integrations->synchronizeAppointment($id);
        $recipientEmail = trim((string) ($payload['email'] ?? $link['recipient_email']));
        $delivery = $notifications->notifyExternal(
            $recipientEmail,
            'Appointment confirmed',
            sprintf('%s is confirmed for %s (%s, %d minutes) via %s.', $link['appointment_type'], (new DateTimeImmutable($slot['start']))->format('F j, Y g:i A'), $link['timezone'], $link['duration_minutes'], $link['meeting_method'])
        );
        alchemize_json_response(['data' => [
            'appointment_created' => true, 'appointment_id' => $id,
            'calendar_sync' => $sync['status'], 'email_delivery' => $delivery,
            'appointment' => ['type' => $link['appointment_type'], 'start' => $slot['start'], 'end' => $slot['end'], 'timezone' => $link['timezone'], 'meeting_method' => $link['meeting_method']],
        ]], 201);
    }

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

        $duration = max(15, (int) ($payload['duration_minutes'] ?? 60));
        $timezone = trim((string) ($payload['timezone'] ?? 'America/New_York')) ?: 'America/New_York';
        $endAt = trim((string) ($payload['end_at'] ?? ''));
        if ($endAt === '') $endAt = (new DateTimeImmutable($scheduledAt, new DateTimeZone($timezone)))->modify("+{$duration} minutes")->format('Y-m-d H:i:s');
        if ($repository->appointmentConflicts($scheduledAt, $endAt) !== []) {
            throw new AlchemizeRequestException(409, 'SLOT_UNAVAILABLE', 'That time conflicts with an existing Alchemize appointment.');
        }
        $appointment = [
            'public_id' => alchemize_uuid_v4(),
            'client_id' => isset($payload['client_id']) && $payload['client_id'] !== '' ? (int) $payload['client_id'] : null,
            'lead_id' => isset($payload['lead_id']) && $payload['lead_id'] !== '' ? (int) $payload['lead_id'] : null,
            'engagement_id' => isset($payload['engagement_id']) && $payload['engagement_id'] !== '' ? (int) $payload['engagement_id'] : null,
            'appointment_type' => $appointmentType,
            'service_id' => isset($payload['service_id']) && $payload['service_id'] !== '' ? (int) $payload['service_id'] : null,
            'scheduled_at' => $scheduledAt,
            'end_at' => $endAt,
            'timezone' => $timezone,
            'location_type' => trim((string) ($payload['location_type'] ?? '')) !== '' ? trim((string) ($payload['location_type'])) : null,
            'status' => in_array((string) ($payload['status'] ?? 'requested'), ['requested','scheduled','confirmed','completed','cancelled'], true) ? (string) $payload['status'] : 'requested',
            'visibility' => in_array((string) ($payload['visibility'] ?? 'admin'), ['admin','client','both'], true) ? (string) $payload['visibility'] : 'admin',
            'client_instructions' => trim((string) ($payload['client_instructions'] ?? '')) !== '' ? trim((string) $payload['client_instructions']) : null,
            'preparation_required' => !empty($payload['preparation_required']) ? 1 : 0,
            'follow_up_required' => !empty($payload['follow_up_required']) ? 1 : 0,
            'internal_notes' => trim((string) ($payload['internal_notes'] ?? '')) !== '' ? trim((string) ($payload['internal_notes'])) : null,
            'owner_user_id' => isset($payload['owner_user_id']) && $payload['owner_user_id'] !== '' ? (int) $payload['owner_user_id'] : null,
            'meeting_method' => trim((string) ($payload['meeting_method'] ?? 'phone')) ?: 'phone',
            'meeting_url' => trim((string) ($payload['meeting_url'] ?? '')) ?: null,
            'location' => trim((string) ($payload['location'] ?? '')) ?: null,
            'duration_minutes' => $duration,
            'source' => 'admin',
            'scheduling_link_id' => null,
            'scheduling_context' => null,
        ];
        if ($appointment['meeting_method'] === 'in_person' && $appointment['location'] === null) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'A location is required for an in-person appointment.');
        }
        if ($appointment['meeting_method'] === 'microsoft_teams' && $appointment['meeting_url'] === null) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'A Microsoft Teams meeting URL is required.');
        }
        $id = $repository->create($appointment);
        $repository->recordAppointmentEvents($id, $appointment, 'appointment.admin_created', 'Appointment created by an administrator.');

        $sync = $integrations->synchronizeAppointment($id);
        $delivery = !empty($payload['client_id'])
            ? $notifications->notifyClient((int) $payload['client_id'], 'admin.appointment.created', 'appointment', (string) $id, 'Appointment scheduled', 'An appointment was added to your client portal.', 'appointment-created:' . $id)
            : (!empty($payload['recipient_email']) ? $notifications->notifyExternal((string) $payload['recipient_email'], 'Appointment scheduled', 'Your appointment with Alchemize has been scheduled.') : 'unavailable');
        alchemize_json_response(['data' => ['id' => $id, 'appointment_type' => $appointmentType, 'appointment_created' => true, 'calendar_sync' => $sync['status'], 'email_delivery' => $delivery]], 201);
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
        $kind = trim((string) ($payload['kind'] ?? 'weekday')) ?: 'weekday';
        if (!in_array($kind, ['weekday','date_override','blocked','full_day','time_off'], true)) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Availability type is invalid.');
        }
        if (!in_array($kind, ['full_day','time_off'], true) && ($startTime === '' || $endTime === '')) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Availability start and end times are required.');
        }
        $id = $repository->createAvailability([
            'public_id' => alchemize_uuid_v4(),
            'user_id' => isset($payload['user_id']) && $payload['user_id'] !== '' ? (int) $payload['user_id'] : null,
            'weekday' => $weekday,
            'date_override' => isset($payload['date_override']) && trim((string) $payload['date_override']) !== '' ? trim((string) $payload['date_override']) : null,
            'end_date' => isset($payload['end_date']) && trim((string) $payload['end_date']) !== '' ? trim((string) $payload['end_date']) : null,
            'start_time' => $startTime !== '' ? $startTime : null,
            'end_time' => $endTime !== '' ? $endTime : null,
            'timezone' => trim((string) ($payload['timezone'] ?? 'America/New_York')) ?: 'America/New_York',
            'is_available' => !empty($payload['is_available']) ? 1 : 0,
            'kind' => $kind,
            'notes' => trim((string) ($payload['notes'] ?? '')) !== '' ? trim((string) $payload['notes']) : null,
            'created_by_user_id' => isset($payload['created_by_user_id']) && $payload['created_by_user_id'] !== '' ? (int) $payload['created_by_user_id'] : null,
        ]);
        alchemize_json_response(['data' => ['id' => $id, 'created' => true]], 201);
    }

    if (count($parts) === 2 && $parts[0] === 'availability' && ctype_digit($parts[1]) && $method === 'PATCH') {
        alchemize_require_staff_or_admin(); alchemize_require_csrf();
        $repository->updateAvailability((int) $parts[1], alchemize_read_json_request('PATCH'));
        alchemize_json_response(['data' => ['id' => (int) $parts[1], 'updated' => true]], 200);
    }

    if (count($parts) === 2 && $parts[0] === 'availability' && ctype_digit($parts[1]) && $method === 'DELETE') {
        alchemize_require_staff_or_admin(); alchemize_require_csrf();
        $repository->deleteAvailability((int) $parts[1]);
        alchemize_json_response(['data' => ['id' => (int) $parts[1], 'deleted' => true]], 200);
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
            'service_id' => isset($payload['service_id']) && $payload['service_id'] !== '' ? (int) $payload['service_id'] : null,
            'appointment_type' => $appointmentType,
            'meeting_method' => trim((string) ($payload['meeting_method'] ?? 'phone')) !== '' ? trim((string) $payload['meeting_method']) : 'phone',
            'duration_minutes' => max(15, (int) ($payload['duration_minutes'] ?? 60)),
            'timezone' => trim((string) ($payload['timezone'] ?? 'America/New_York')) ?: 'America/New_York',
            'location' => trim((string) ($payload['location'] ?? '')) ?: null,
            'expires_at' => $expiresAt,
            'max_uses' => max(1, (int) ($payload['max_uses'] ?? 1)),
            'created_by_user_id' => isset($payload['created_by_user_id']) && $payload['created_by_user_id'] !== '' ? (int) $payload['created_by_user_id'] : null,
            'recipient_name' => trim((string) ($payload['recipient_name'] ?? '')) !== '' ? trim((string) $payload['recipient_name']) : null,
            'recipient_email' => $recipientEmail,
            'recipient_phone' => trim((string) ($payload['recipient_phone'] ?? '')) ?: null,
            'notes' => trim((string) ($payload['notes'] ?? '')) !== '' ? trim((string) $payload['notes']) : null,
        ]);
        $baseUrl = trim((string) ($_SERVER['APP_URL'] ?? $_SERVER['HTTP_ORIGIN'] ?? 'https://localhost'));
        $baseUrl = rtrim($baseUrl, '/');
        $url = $baseUrl . '/appointment/schedule/' . $token;
        $delivery = $notifications->notifyExternal(
            $recipientEmail,
            'Schedule your Alchemize appointment',
            sprintf('Hello %s, use the secure scheduling page to choose a time for your %s. This invitation expires %s.', trim((string) ($payload['recipient_name'] ?? '')) ?: 'there', $appointmentType, $expiresAt),
            $url,
            'Schedule Appointment'
        );
        $linkId = $repository->schedulingLinkIdByToken($token);
        if ($linkId !== null) $repository->recordSchedulingLinkDelivery($linkId, $delivery);
        $response = ['expires_at' => $expiresAt, 'delivery_status' => $delivery, 'recipient_email' => $recipientEmail];
        if ($delivery !== 'sent') $response['copy_url'] = $url;
        alchemize_json_response(['data' => $response], 201);
    }

    throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested appointment route was not found.');
} catch (AlchemizeRequestException $error) {
    alchemize_error_response($error->httpStatus, $error->errorCode, $error->getMessage());
} catch (Throwable $error) {
    error_log(sprintf('Appointments API failure [%s]: %s', get_class($error), $error->getMessage()));
    alchemize_error_response(500, 'INTERNAL_ERROR', 'Appointments API is temporarily unavailable.');
}
