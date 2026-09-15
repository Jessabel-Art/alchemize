<?php
// System & Integrations connection health, run against the REAL local dev
// database with disposable fixtures:
//
//   - AlchemizeExternalIntegrationRepository::setCalendarState() actually
//     clears a stale meeting_url when the calendar service signals
//     clear_meeting_url (the appointment's location moved away from
//     Google Meet), but a failed/undetermined sync with no new URL and no
//     clear signal still preserves whatever meeting_url was last known --
//     proving the COALESCE bug (stale links never clearing) is fixed
//     without also regressing "don't wipe a link on a transient failure".
//   - AlchemizeSystemIntegrationsService reflects whichever of the most
//     recent success/error actually happened last ("most recent wins"),
//     rather than treating any error ever recorded as permanently
//     degrading status, and surfaces Google Meet capability from the
//     persisted audit metadata of the last successful check.
declare(strict_types=1);

function verifyHealth(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}

putenv('ALCHEMIZE_DB_HOST=127.0.0.1');
putenv('ALCHEMIZE_DB_PORT=3306');
putenv('ALCHEMIZE_DB_NAME=alchemize_dev');
putenv('ALCHEMIZE_DB_USER=alchemize_dev_user');
putenv('ALCHEMIZE_DB_PASSWORD=AryahLeo1017!');

require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/config/config.php';
require_once __DIR__.'/../../server/database/connection.php';
require_once __DIR__.'/../../server/repositories/external-integration-repository.php';
require_once __DIR__.'/../../server/services/system-integrations-service.php';
require_once __DIR__.'/../../server/services/lead-service.php';

$config = alchemize_config();
try {
    $db = alchemize_database($config['database']);
} catch (Throwable $error) {
    echo "SKIPPED: no local dev database reachable (" . $error->getMessage() . ").\n";
    exit(0);
}

$adminUserId = (int) $db->query("SELECT id FROM users ORDER BY id LIMIT 1")->fetchColumn();
verifyHealth($adminUserId > 0, 'Setup failed: no user exists to attribute check events to');

$suffix = bin2hex(random_bytes(4));
$cleanupAppointmentIds = [];
$cleanupAuditIds = [];

try {
    // --- setCalendarState: clear vs preserve meeting_url --------------------
    echo "=== Calendar sync meeting_url clear/preserve ===\n";
    $repository = new AlchemizeExternalIntegrationRepository($db);
    $publicId = alchemize_uuid_v4();
    $db->prepare('INSERT INTO appointments (public_id, appointment_type, scheduled_at, status, meeting_method) VALUES (:pid, :type, :scheduled, :status, :method)')
        ->execute(['pid' => $publicId, 'type' => "ZZZ Integration Health {$suffix}", 'scheduled' => date('Y-m-d H:i:s', strtotime('+3 days')), 'status' => 'confirmed', 'method' => 'google_meet']);
    $appointmentId = (int) $db->lastInsertId();
    $cleanupAppointmentIds[] = $appointmentId;

    $repository->setCalendarState($appointmentId, 'synchronized', 'evt-a', null, 'https://meet.google.com/aaa-bbbb-ccc');
    $row = $db->query("SELECT meeting_url, google_calendar_event_id FROM appointments WHERE id = {$appointmentId}")->fetch(PDO::FETCH_ASSOC);
    verifyHealth($row['meeting_url'] === 'https://meet.google.com/aaa-bbbb-ccc', 'A real Meet URL was not persisted on sync');
    verifyHealth($row['google_calendar_event_id'] === 'evt-a', 'The calendar event id was not persisted');
    echo "PASS A real Meet URL from Calendar is persisted\n";

    $repository->setCalendarState($appointmentId, 'synchronized', 'evt-a', null, null, true);
    $row = $db->query("SELECT meeting_url FROM appointments WHERE id = {$appointmentId}")->fetch(PDO::FETCH_ASSOC);
    verifyHealth($row['meeting_url'] === null, 'The stale meeting_url was not cleared when the appointment moved away from Google Meet (the COALESCE bug)');
    echo "PASS Moving the appointment away from Google Meet clears the stale join link\n";

    $repository->setCalendarState($appointmentId, 'synchronized', 'evt-a', null, 'https://meet.google.com/xyz-wwww-yyy');
    $repository->setCalendarState($appointmentId, 'failed', null, 'provider_error');
    $row = $db->query("SELECT meeting_url, calendar_sync_status FROM appointments WHERE id = {$appointmentId}")->fetch(PDO::FETCH_ASSOC);
    verifyHealth($row['meeting_url'] === 'https://meet.google.com/xyz-wwww-yyy', 'A transient failed sync incorrectly wiped a previously-known meeting_url');
    verifyHealth($row['calendar_sync_status'] === 'failed', 'The failed sync status was not recorded');
    echo "PASS A transient failed sync preserves the last known meeting_url instead of wiping it\n";

    // --- System integrations: most-recent-wins status, Meet capability ------
    echo "\n=== Integration status: most-recent-wins ===\n";
    $service = new AlchemizeSystemIntegrationsService($db, $config, $adminUserId);

    $insertAudit = function (string $eventType, string $entityId, string $summary, string $createdAtOffsetSql, array $metadata = []) use ($db, $adminUserId, &$cleanupAuditIds): void {
        $id = alchemize_uuid_v4();
        $db->prepare("INSERT INTO audit_events (public_id, actor_user_id, event_type, entity_type, entity_id, action_summary, request_metadata, created_at) VALUES (:pid, :actor, :type, 'integration', :entity, :summary, :metadata, DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL {$createdAtOffsetSql}))")
            ->execute(['pid' => $id, 'actor' => $adminUserId, 'type' => $eventType, 'entity' => $entityId, 'summary' => $summary, 'metadata' => json_encode($metadata, JSON_THROW_ON_ERROR)]);
        $cleanupAuditIds[] = $id;
    };

    // An older error followed by a newer success -- status must read as
    // Connected, not permanently "Degraded" from the stale error.
    $insertAudit('integration.check.error', 'google_drive', 'Google Drive connection check failed: authentication failed.', '-10 MINUTE');
    $insertAudit('integration.check.success', 'google_drive', 'Google Drive connection check succeeded.', '-1 MINUTE');
    $summary = $service->summary();
    verifyHealth($summary['integrations']['google_drive']['status'] === 'Connected', 'A newer successful check did not override an older recorded error');
    echo "PASS A newer success supersedes an older recorded error (status: Connected)\n";

    // The reverse: a newer error after an older success must read as Error.
    $insertAudit('integration.check.success', 'stripe', 'Stripe connection check succeeded.', '-10 MINUTE');
    $insertAudit('integration.check.error', 'stripe', 'Stripe connection check failed: credentials rejected.', '-1 MINUTE');
    $summary = $service->summary();
    verifyHealth($summary['integrations']['stripe']['status'] === 'Error', 'A newer error did not override an older recorded success');
    verifyHealth(str_contains((string) $summary['integrations']['stripe']['last_error'], 'credentials'), 'The sanitized last_error did not reflect the real failure reason');
    echo "PASS A newer error supersedes an older recorded success (status: Error)\n";

    // Meet capability is read back from the last successful check's own
    // persisted metadata, never assumed true just because Calendar is
    // reachable.
    $insertAudit('integration.check.success', 'google_calendar', 'Google Calendar connection check succeeded.', '-1 MINUTE', ['meet_capable' => true]);
    $summary = $service->summary();
    verifyHealth($summary['integrations']['google_calendar']['meet_capable'] === true, 'Meet capability from the last successful check was not surfaced');
    echo "PASS Google Meet capability is reported from real recorded check metadata\n";
} finally {
    if ($cleanupAuditIds) {
        $placeholders = implode(',', array_fill(0, count($cleanupAuditIds), '?'));
        $db->prepare("DELETE FROM audit_events WHERE public_id IN ({$placeholders})")->execute($cleanupAuditIds);
    }
    if ($cleanupAppointmentIds) {
        $ids = implode(',', array_map('intval', $cleanupAppointmentIds));
        $db->exec("DELETE FROM audit_events WHERE entity_type = 'appointment' AND entity_id IN ({$ids})");
        $db->exec("DELETE FROM appointments WHERE id IN ({$ids})");
    }
}

echo "\nSystem & Integrations connection health: meeting_url clear/preserve semantics and most-recent-wins status composition both verified against the real database.\n";
