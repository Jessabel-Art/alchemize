<?php

declare(strict_types=1);
require_once __DIR__ . '/../../server/http/request.php';
require_once __DIR__ . '/../../server/repositories/appointment-repository.php';
require_once __DIR__ . '/../../server/repositories/external-integration-repository.php';
require_once __DIR__ . '/../../server/services/appointment-scheduling-service.php';
function alchemize_uuid_v4(): string { return bin2hex(random_bytes(16)); }
function verify(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
final class AppointmentPDO extends PDO {
    public array $rows = []; public array $events = [];
    public function __construct() {}
    public function prepare(string $query, array $options = []): PDOStatement|false { return new AppointmentStatement($this, $query); }
    public function lastInsertId(?string $name = null): string|false { return (string) count($this->rows); }
}
final class AppointmentStatement extends PDOStatement {
    private array $result = [];
    public function __construct(private AppointmentPDO $db, private string $sql) {}
    public function execute(?array $params = null): bool {
        $p = $params ?? [];
        preg_match_all('/(?<!:):([a-z_]+)/i', $this->sql, $matches);
        verify(count($matches[1]) === count(array_unique($matches[1])), 'SQLSTATE[HY093]: repeated native PDO placeholder');
        verify(count(array_diff($matches[1], array_keys($p))) === 0 && count(array_diff(array_keys($p), $matches[1])) === 0, 'SQL parameter contract mismatch');
        if (str_starts_with($this->sql, 'INSERT INTO appointments')) { $id = count($this->db->rows) + 1; $this->db->rows[$id] = ['id' => $id] + $p; }
        elseif (str_starts_with($this->sql, 'UPDATE appointments')) { $id = $p['id']; unset($p['id']); $this->db->rows[$id] = array_replace($this->db->rows[$id], $p); }
        elseif (str_contains($this->sql, 'INSERT INTO activity_events') || str_contains($this->sql, 'INSERT INTO audit_events')) $this->db->events[] = $p;
        elseif (str_contains($this->sql, 'SELECT * FROM appointments')) $this->result = isset($this->db->rows[$p['id']]) ? [$this->db->rows[$p['id']]] : [];
        else throw new RuntimeException('Unexpected SQL in appointment test');
        return true;
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed { return array_shift($this->result) ?? false; }
}
$db = new AppointmentPDO(); $repo = new AlchemizeAppointmentRepository($db); $scheduler = new AlchemizeAppointmentSchedulingService($repo);
$create = ['public_id' => 'appointment-1', 'client_id' => 4, 'engagement_id' => 8, 'service_id' => 2, 'appointment_type' => 'consultation', 'scheduled_at' => '2030-09-10 10:00:00', 'timezone' => 'America/New_York', 'duration_minutes' => 75, 'status' => 'confirmed', 'follow_up_required' => true, 'internal_notes' => 'Keep these notes'];
$id = $repo->create(array_replace($create, $scheduler->normalizeAdminMutation($create)));
verify($repo->findById($id)['end_at'] === '2030-09-10 11:15:00', 'Create end/timezone/duration failed');
echo "PASS create persists supported relationships and schedule\n";
$update = $scheduler->normalizeAdminMutation(['scheduled_at' => '2030-09-12 13:00:00', 'duration_minutes' => 30, 'meeting_method' => 'google_meet', 'internal_notes' => 'Edited notes'], $repo->findById($id));
$repo->update($id, $update); $row = $repo->findById($id);
verify($row['end_at'] === '2030-09-12 13:30:00' && $row['status'] === 'confirmed' && count($db->rows) === 1, 'Edit left stale end/status or duplicated appointment');
echo "PASS edit/reschedule recalculates end and preserves single record\n";
$repo->update($id, $scheduler->normalizeAdminMutation(['follow_up_required' => false], $row));
verify($repo->findById($id)['follow_up_required'] === 0 && $repo->findById($id)['status'] === 'confirmed', 'Follow-up changed status instead of boolean');
echo "PASS follow-up completion persists without status change\n";
$cancel = $scheduler->normalizeAdminMutation(['status' => 'cancelled', 'cancellation_reason' => 'Client requested'], $repo->findById($id));
$repo->update($id, $cancel); $row = $repo->findById($id);
$repo->recordAppointmentEvents($id, $row, 'appointment.cancelled', 'Appointment cancelled');
verify($row['status'] === 'cancelled' && isset($row['cancelled_at']) && str_contains($row['internal_notes'], 'Edited notes') && str_contains($row['internal_notes'], 'Client requested') && count($db->events) === 2, 'Cancellation history lost');
echo "PASS cancellation retains notes, timestamp and activity/audit\n";
foreach (['needs_reschedule', 'follow-up_required', 'upcoming'] as $status) {
    try { $scheduler->normalizeAdminMutation(['status' => $status], $row); throw new RuntimeException('Invalid status accepted'); }
    catch (AlchemizeRequestException $error) { verify($error->httpStatus === 422, 'Wrong validation status'); }
}
echo "PASS unsupported statuses rejected\n";
$integrationRepo = new AlchemizeExternalIntegrationRepository($db);
$integrationRepo->setCalendarState($id, 'synchronized', 'existing-event');
verify($db->rows[$id]['synced_status'] === 'synchronized', 'Calendar SQL binding failed');
echo "PASS calendar state SQL uses unique native PDO bindings\n";
