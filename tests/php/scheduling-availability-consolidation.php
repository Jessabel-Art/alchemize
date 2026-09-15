<?php
// Blocked Time / Extended Availability consolidation: verifies the REAL
// AlchemizeAppointmentSchedulingService::slots() interval logic directly
// against a lightweight mock PDO (same harness shape as
// tests/php/portal-booking.php), independent of any real database. Proves:
//
//   - an all-day Blocked Time record (kind=time_off or full_day, no times)
//     produces zero slots for that date
//   - a partial Blocked Time record is excluded by real interval overlap,
//     not just a start-time comparison -- an appointment that would only
//     partially overlap the blocked range is still rejected
//   - unaffected slots outside the blocked range remain bookable
//   - Extended Availability (date_override, is_available=1) is additive:
//     it supplements the normal working hours rather than replacing them
//   - a date_override explicitly marked unavailable still closes the date
//     entirely (existing backward-compatible "close via override" use)
declare(strict_types=1);

function verifySlots(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}

require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/repositories/appointment-repository.php';
require_once __DIR__.'/../../server/services/appointment-scheduling-service.php';

final class SlotsPDO extends PDO {
    public array $availability = [];
    public array $appointments = [];
    public function __construct() {}
    public function prepare(string $query, array $options = []): PDOStatement|false {
        return new SlotsStatement($this, $query);
    }
    public function query(string $query, ?int $fetchMode = null, mixed ...$args): PDOStatement|false {
        $statement = $this->prepare($query);
        $statement->execute();
        return $statement;
    }
}
final class SlotsStatement extends PDOStatement {
    private array $rows = [];
    public function __construct(private SlotsPDO $db, private string $sql) {}
    public function execute(?array $params = null): bool {
        $q = $this->sql;
        $p = $params ?? [];
        if (str_contains($q, 'FROM appointment_availability')) {
            $this->rows = $this->db->availability;
        } elseif (str_contains($q, 'FROM appointments')) {
            $this->rows = [];
            foreach ($this->db->appointments as $row) {
                if ($row['scheduled_at'] < $p['end_at'] && $row['end_at'] > $p['start_at']) {
                    $this->rows[] = $row;
                }
            }
        } else {
            throw new RuntimeException('Unexpected SQL: ' . $q);
        }
        return true;
    }
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array { return $this->rows; }
}

$db = new SlotsPDO();
$repo = new AlchemizeAppointmentRepository($db);
$scheduler = new AlchemizeAppointmentSchedulingService($repo, 'America/New_York');
$link = ['timezone' => 'America/New_York', 'duration_minutes' => 60];
// A future weekday with normal 9-5 business hours (no explicit weekday
// rule, so the default business schedule applies) and no conflicting
// appointments unless a test adds one.
$date = '2030-09-18'; // a Wednesday

// --- All-day Blocked Time -----------------------------------------------
$db->availability = [['kind' => 'time_off', 'is_available' => 0, 'start_time' => null, 'end_time' => null]];
$db->appointments = [];
verifySlots($scheduler->slots($link, $date) === [], 'All-day Blocked Time (time_off) did not produce zero slots');

$db->availability = [['kind' => 'full_day', 'is_available' => 0, 'start_time' => null, 'end_time' => null]];
verifySlots($scheduler->slots($link, $date) === [], 'All-day Blocked Time (full_day, legacy kind) did not produce zero slots');
echo "PASS All-day Blocked Time produces zero bookable slots for the date\n";

// --- Partial Blocked Time: real interval overlap, not just start-time ---
$db->availability = [['kind' => 'blocked', 'is_available' => 0, 'start_time' => '13:00:00', 'end_time' => '15:00:00']];
$slots = $scheduler->slots($link, $date);
$labels = array_column($slots, 'label');
verifySlots(!in_array('12:30 PM', $labels, true), 'A 60-minute slot starting before the block that runs into it (12:30 PM) was incorrectly offered');
verifySlots(!in_array('1:00 PM', $labels, true), 'A slot starting inside the blocked range (1:00 PM) was incorrectly offered');
verifySlots(!in_array('2:30 PM', $labels, true), 'A 60-minute slot starting inside the block that runs past it (2:30 PM) was incorrectly offered');
verifySlots(in_array('11:00 AM', $labels, true), 'A valid morning slot unaffected by the block was incorrectly withheld');
verifySlots(in_array('3:00 PM', $labels, true), 'A valid slot starting exactly when the block ends was incorrectly withheld');
echo "PASS Partial Blocked Time uses real interval overlap and preserves unaffected slots\n";

// --- Extended Availability is additive -----------------------------------
$db->availability = [['kind' => 'date_override', 'is_available' => 1, 'start_time' => '17:00:00', 'end_time' => '19:00:00']];
$slots = $scheduler->slots($link, $date);
$labels = array_column($slots, 'label');
verifySlots(in_array('9:00 AM', $labels, true), 'Extended Availability replaced normal working hours instead of supplementing them (9:00 AM missing)');
verifySlots(in_array('4:00 PM', $labels, true), 'Extended Availability replaced normal working hours instead of supplementing them (4:00 PM missing)');
verifySlots(in_array('5:00 PM', $labels, true), 'Extended Availability hours were not added as additional bookable slots (5:00 PM missing)');
verifySlots(in_array('6:00 PM', $labels, true), 'Extended Availability hours were not added as additional bookable slots (6:00 PM missing)');
echo "PASS Extended Availability adds slots on top of normal working hours\n";

// --- A date_override explicitly marked unavailable still closes the date (backward compatible) ---
$db->availability = [['kind' => 'date_override', 'is_available' => 0, 'start_time' => null, 'end_time' => null]];
verifySlots($scheduler->slots($link, $date) === [], 'A date_override explicitly marked unavailable did not close the date');
echo "PASS A date_override marked unavailable still closes the date entirely (backward compatible)\n";

// --- Blocked Time overlapping an existing appointment: the appointment itself is a busy interval ---
$db->availability = [];
$db->appointments = [['scheduled_at' => "{$date} 14:00:00", 'end_at' => "{$date} 15:00:00"]];
$slots = $scheduler->slots($link, $date);
$labels = array_column($slots, 'label');
verifySlots(!in_array('2:00 PM', $labels, true), 'An existing appointment did not block its own slot');
verifySlots(!in_array('1:30 PM', $labels, true), 'An existing appointment did not block a slot that would overlap into it');
verifySlots(in_array('3:00 PM', $labels, true), 'A slot immediately after an existing appointment was incorrectly withheld');
echo "PASS Existing appointments are excluded by real interval overlap, independent of Blocked Time records\n";

echo "\nScheduling availability consolidation: all-day and partial Blocked Time, additive Extended Availability, and backward-compatible closing overrides all verified against the real scheduling service.\n";
