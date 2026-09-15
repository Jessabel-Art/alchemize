import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("repository saves and returns the blocked interval and scheduling excludes it", () => {
  // Run the real PHP repository and scheduler with an in-memory PDO test double.
  // This verifies their contract, not a deployed database or HTTP endpoint.
  const result = spawnSync(
    "php",
    [
      "-r",
      `
    require 'server/repositories/appointment-repository.php';
    require 'server/services/appointment-scheduling-service.php';
    final class AvailabilityPDO extends PDO {
      public array $rows = [];
      public function __construct() {}
      public function prepare(string $query, array $options = []): PDOStatement|false {
        return new AvailabilityStatement($this, $query);
      }
      public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false {
        $statement = $this->prepare($query); $statement->execute(); return $statement;
      }
      public function lastInsertId(?string $name = null): string|false { return '1'; }
    }
    final class AvailabilityStatement extends PDOStatement {
      private array $result = [];
      public function __construct(private AvailabilityPDO $db, private string $sql) {}
      public function execute(?array $params = null): bool {
        if (str_contains($this->sql, 'INSERT INTO appointment_availability')) {
          $this->db->rows[] = ['id' => 1] + $params;
        } elseif (str_contains($this->sql, 'SELECT * FROM appointment_availability')) {
          $this->result = array_values(array_filter($this->db->rows, fn($row) => !$params || $row['date_override'] === $params['date']));
        } elseif (str_contains($this->sql, 'FROM appointments')) {
          $this->result = [];
        } else throw new RuntimeException('Unexpected SQL');
        return true;
      }
      public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array { return $this->result; }
    }
    $db = new AvailabilityPDO();
    $repository = new AlchemizeAppointmentRepository($db);
    $scheduler = new AlchemizeAppointmentSchedulingService($repository);
    $link = ['timezone' => 'America/New_York', 'duration_minutes' => 60];
    $id = $repository->createAvailability([
      'public_id' => 'test', 'user_id' => null, 'weekday' => null,
      'date_override' => '2026-09-17', 'end_date' => null,
      'start_time' => '08:00', 'end_time' => '17:00',
      'timezone' => 'America/New_York', 'is_available' => 1,
      'kind' => 'blocked', 'notes' => 'test', 'created_by_user_id' => null,
    ]);
    $rows = $repository->availabilityForDate('2026-09-17');
    // Exercise overlap independently of today's date so this regression never expires.
    $overlap = new ReflectionMethod($scheduler, 'overlapsRows');
    $timezone = new DateTimeZone('America/New_York');
    $start = new DateTimeImmutable('2026-09-17 08:00', $timezone);
    $end = new DateTimeImmutable('2026-09-17 17:00', $timezone);
    echo json_encode(['id' => $id, 'rows' => $repository->listAvailability(),
      'unblocked' => $overlap->invoke($scheduler, $start, $end, [], '2026-09-17', $timezone),
      'blocked' => $overlap->invoke($scheduler, $start, $end, $rows, '2026-09-17', $timezone),
      'after' => $scheduler->slots($link, '2026-09-17')]);
  `,
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  const saved = JSON.parse(result.stdout);
  assert.equal(saved.id, 1);
  assert.equal(saved.rows.length, 1);
  assert.equal(saved.rows[0].start_time, "08:00");
  assert.equal(saved.rows[0].end_time, "17:00");
  assert.equal(saved.rows[0].date_override, "2026-09-17");
  assert.equal(saved.rows[0].timezone, "America/New_York");
  assert.equal(saved.unblocked, false);
  assert.equal(saved.blocked, true);
  assert.deepEqual(saved.after, []);
});
