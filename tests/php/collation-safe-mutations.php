<?php
// Regression guard for the production incident where several repository
// methods compared a bound PDO parameter directly against a SQL string
// literal (e.g. IF(:status = 'synchronized', ...)). With
// PDO::ATTR_EMULATE_PREPARES disabled (server/database/connection.php),
// MySQL sends bound string parameters as utf8mb4_general_ci while inline
// literals use the connection's utf8mb4_unicode_ci, so comparing them
// throws PDOException SQLSTATE[HY000] 1267 "Illegal mix of collations" —
// reproduced live against production for every method tested here
// (Appointments scheduling-link delivery, Client Management access grants,
// Communications thread state, Google Drive/Calendar sync state,
// notification delivery). Each fix resolves the comparison in PHP before
// binding, so the executed SQL never compares a placeholder to a literal.
// This test asserts both the corrected behavior AND that no regression
// reintroduces the unsafe SQL shape.
require_once __DIR__.'/../../server/repositories/appointment-repository.php';
require_once __DIR__.'/../../server/repositories/portal-admin-repository.php';
require_once __DIR__.'/../../server/repositories/external-integration-repository.php';
require_once __DIR__.'/../../server/repositories/notification-repository.php';

function verifyCollation(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}

final class CollationPDO extends PDO {
    public array $lastSql = [];
    public array $columns = [
        'notifications' => ['delivery_status', 'delivered_at', 'delivery_error'],
    ];
    public function __construct(){}
    public function prepare(string $query, array $options = []): PDOStatement|false {
        $this->lastSql[] = $query;
        // Fail loudly if a future regression reintroduces a bound
        // parameter compared directly to a string literal.
        if (preg_match('/:\w+\s*=\s*\'[a-z_]+\'/i', $query) === 1) {
            throw new RuntimeException('Unsafe SQL: bound parameter compared directly to a string literal: '.$query);
        }
        return new CollationStatement($this, $query);
    }
    public function query(string $query, ?int $fetchMode = null, mixed ...$args): PDOStatement|false {
        $this->lastSql[] = $query;
        return new CollationStatement($this, $query);
    }
    public function columnExists(string $table, string $column): bool {
        return in_array($column, $this->columns[$table] ?? [], true);
    }
}
final class CollationStatement extends PDOStatement {
    public array $executedWith = [];
    private array $rows = [];
    public function __construct(private CollationPDO $db, private string $sql) {}
    public function execute(?array $params = null): bool {
        $this->executedWith = $params ?? [];
        if (str_contains($this->sql, 'information_schema.columns')) {
            $this->rows = [['1' => (int) $this->db->columnExists((string) ($params['table'] ?? ''), (string) ($params['column'] ?? ''))]];
        } elseif (preg_match('/SHOW COLUMNS FROM (\w+)/', $this->sql, $match) === 1) {
            $exists = $this->db->columnExists($match[1], (string) ($params['column'] ?? ''));
            $this->rows = $exists ? [['Field' => $params['column']]] : [];
        } elseif (str_starts_with(trim($this->sql), 'SELECT id, client_id FROM message_threads')) {
            $this->rows = [['id' => 1, 'client_id' => 9]];
        }
        return true;
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed {
        return array_shift($this->rows) ?? false;
    }
    public function fetchColumn(int $column = 0): mixed { return false; }
    public function rowCount(): int { return 1; }
}

$db = new CollationPDO();

// Appointments: scheduling-link delivery status.
$apptRepo = new AlchemizeAppointmentRepository($db);
$apptRepo->recordSchedulingLinkDelivery(1, 'sent');
$sentSql = end($db->lastSql);
verifyCollation(!preg_match('/:\w+\s*=\s*\'/', $sentSql), 'recordSchedulingLinkDelivery(sent) still compares a bound param to a literal');
$apptRepo->recordSchedulingLinkDelivery(1, 'failed');
verifyCollation(true, 'recordSchedulingLinkDelivery(failed) did not throw');

// Client Management: portal access grant status.
$portalRepo = new AlchemizePortalAdminRepository($db);
$portalRepo->updateAccessGrant('grant-1', 'primary_contact', 'active', 1);
$activeSql = end($db->lastSql);
verifyCollation(str_contains($activeSql, 'CURRENT_TIMESTAMP(6)'), 'updateAccessGrant(active) should set effective_at to now');
verifyCollation(!preg_match('/:\w+\s*=\s*\'/', $activeSql), 'updateAccessGrant(active) still compares a bound param to a literal');
$portalRepo->updateAccessGrant('grant-1', 'primary_contact', 'suspended', 1);
verifyCollation(true, 'updateAccessGrant(suspended) did not throw');

// Communications: message thread archive/status state.
$portalRepo->updateThreadState('thread-1', 'archived', false);
$archiveSql = end($db->lastSql);
verifyCollation(str_contains($archiveSql, 'archived_at = CURRENT_TIMESTAMP(6)'), 'updateThreadState(archived) should set archived_at to now');
$portalRepo->updateThreadState('thread-1', 'waiting_on_alchemize', false);
$restoreSql = end($db->lastSql);
verifyCollation(str_contains($restoreSql, 'archived_at = NULL'), 'updateThreadState(non-archived) should clear archived_at');
verifyCollation(!preg_match('/:\w+\s*=\s*\'/', $restoreSql), 'updateThreadState still compares a bound param to a literal');

// Google Drive / Calendar sync state.
$integrationRepo = new AlchemizeExternalIntegrationRepository($db);
$integrationRepo->setClientDriveState(9, 'synchronized', 'folder-1');
verifyCollation(!preg_match('/:\w+\s*=\s*\'/', end($db->lastSql)), 'setClientDriveState still compares a bound param to a literal');
$integrationRepo->setDocumentDriveState(1, 'synchronized', 'file-1');
verifyCollation(!preg_match('/:\w+\s*=\s*\'/', end($db->lastSql)), 'setDocumentDriveState still compares a bound param to a literal');
$integrationRepo->setCalendarState(2, 'synchronized', 'event-1');
verifyCollation(!preg_match('/:\w+\s*=\s*\'/', end($db->lastSql)), 'setCalendarState still compares a bound param to a literal');

// Notification delivery.
$notificationRepo = new AlchemizeNotificationRepository($db);
$notificationRepo->recordDelivery('notif-1', 'sent');
$deliverySql = end($db->lastSql);
verifyCollation(str_contains($deliverySql, 'delivered_at = CURRENT_TIMESTAMP(6)'), 'recordDelivery(sent) should set delivered_at to now');
verifyCollation(!preg_match('/:\w+\s*=\s*\'/', $deliverySql), 'recordDelivery still compares a bound param to a literal');

echo "Collation-safe mutations: scheduling-link delivery, access grant, thread state, drive/calendar sync, and notification delivery all resolve status comparisons in PHP instead of comparing a bound parameter to a SQL literal.\n";
