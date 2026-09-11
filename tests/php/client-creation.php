<?php
// Admin -> Client Management -> "+ Client or Prospect" -> Client (direct
// creation) had no protection against an accidental repeat submission:
// AlchemizeClientService::create() unconditionally inserted a new client
// row every call, and the frontend had no re-entry guard or disabled
// state on "Create client" at all (unlike the prospect-conversion flow's
// "Confirm conversion" button). Reproduced directly against production:
// the create -> portal-provision -> commit chain completes in well under
// a second with no thrown exception, so a double-click (or a retry after
// a slow response) reliably created two client rows for one intended
// operation -- exactly matching the two "Joseph Santos" client records
// found in production roughly two seconds apart.
//
// This test proves the fix: a client-generated idempotency key, persisted
// on the client row via a unique index (migrations/038), makes a repeat
// submission of the same create operation return the original client
// instead of inserting a second one -- both when the key is recognized up
// front (a retried request after the first attempt already committed) and
// when two inserts race for the same key (a concurrent duplicate that
// collides on the unique index, mocked here as a PDOException 1062).
declare(strict_types=1);
require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/repositories/client-repository.php';
require_once __DIR__.'/../../server/repositories/activity-repository.php';
require_once __DIR__.'/../../server/services/client-service.php';

function alchemize_uuid_v4(): string { return 'test-uuid-'.bin2hex(random_bytes(6)); }
function verifyClient(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }

final class ClientCreationPDO extends PDO {
    public array $clients = [];
    public array $activity = [];
    public int $nextClientId = 1;
    // Simulates the unique index on clients.idempotency_key: the next
    // INSERT carrying a key already present in $clients throws exactly
    // like a real duplicate-key collision from a concurrent request.
    public bool $forceDuplicateKeyOnNextInsert = false;
    public function __construct() {}
    public function prepare(string $query, array $options = []): PDOStatement|false { return new ClientCreationStatement($this, $query); }
    public function lastInsertId(?string $name = null): string|false { return (string) ($this->nextClientId - 1); }
}

final class ClientCreationStatement extends PDOStatement {
    private array $rows = [];
    public function __construct(private ClientCreationPDO $db, private string $sql) {}
    public function execute(?array $params = null): bool {
        $p = $params ?? [];
        if (str_starts_with($this->sql, 'INSERT INTO clients')) {
            $key = $p['idempotency_key'] ?? null;
            if ($key !== null) {
                foreach ($this->db->clients as $existing) {
                    if (($existing['idempotency_key'] ?? null) === $key) {
                        $error = new PDOException("SQLSTATE[23000]: Duplicate entry '$key' for key 'uniq_clients_idempotency_key'");
                        $error->errorInfo = ['23000', 1062, "Duplicate entry '$key'"];
                        throw $error;
                    }
                }
            }
            if ($this->db->forceDuplicateKeyOnNextInsert) {
                $this->db->forceDuplicateKeyOnNextInsert = false;
                // Simulates a concurrent request's insert committing for
                // this same key between this request's up-front lookup
                // (which saw nothing) and its own insert.
                $winnerId = $this->db->nextClientId++;
                $this->db->clients[$winnerId] = ['id' => $winnerId, 'display_name' => 'Race Winner', 'client_type' => 'individual', 'idempotency_key' => $key];
                $error = new PDOException("SQLSTATE[23000]: Duplicate entry '$key' for key 'uniq_clients_idempotency_key'");
                $error->errorInfo = ['23000', 1062, "Duplicate entry '$key'"];
                throw $error;
            }
            $id = $this->db->nextClientId++;
            $this->db->clients[$id] = ['id' => $id] + $p;
            return true;
        }
        if (str_contains($this->sql, 'FROM clients') && str_contains($this->sql, 'idempotency_key')) {
            $this->rows = [];
            foreach ($this->db->clients as $row) {
                if (($row['idempotency_key'] ?? null) === ($p['idempotency_key'] ?? null)) { $this->rows = [$row]; break; }
            }
            return true;
        }
        if (str_starts_with($this->sql, 'INSERT INTO activity_events')) {
            $this->db->activity[] = $p;
            return true;
        }
        throw new RuntimeException('Unexpected SQL: '.$this->sql);
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed { return array_shift($this->rows) ?? false; }
}

$db = new ClientCreationPDO();
$clientRepo = new AlchemizeClientRepository($db);
$activityRepo = new AlchemizeActivityRepository($db);
$service = new AlchemizeClientService($clientRepo, $activityRepo);

$payload = [
    'client_type' => 'individual',
    'display_name' => 'Jordan Rivera',
    'primary_email' => 'jordan@example.test',
    'idempotency_key' => 'submission-key-1',
];

// First submission creates exactly one client.
$created = $service->create($payload);
verifyClient(count($db->clients) === 1, 'First submission did not create exactly one client');
verifyClient(($created['idempotent_replay'] ?? false) === false, 'First submission was incorrectly reported as a replay');
$firstClientId = $created['id'];
verifyClient(count($db->activity) === 1, 'First submission did not record an activity event');
echo "PASS first submission creates exactly one client and logs one activity event\n";

// A repeat submission with the same idempotency key (retried request,
// second tab, replayed click after the first response was slow) must not
// create a second client -- it returns the original one.
$repeat = $service->create($payload);
verifyClient(count($db->clients) === 1, 'Repeat submission created a duplicate client');
verifyClient($repeat['id'] === $firstClientId, 'Repeat submission did not return the original client id');
verifyClient(($repeat['idempotent_replay'] ?? false) === true, 'Repeat submission was not reported as a replay');
verifyClient(count($db->activity) === 1, 'Repeat submission logged a second activity event');
echo "PASS repeat submission with the same idempotency key returns the existing client, no duplicate\n";

// A genuinely distinct submission (different key) is unaffected -- this is
// not a global email/name uniqueness rule, only same-operation protection.
$second = $service->create([
    'client_type' => 'individual',
    'display_name' => 'Jordan Rivera',
    'primary_email' => 'jordan@example.test',
    'idempotency_key' => 'submission-key-2',
]);
verifyClient(count($db->clients) === 2, 'A distinct submission sharing name/email was incorrectly blocked');
verifyClient($second['id'] !== $firstClientId, 'A distinct submission was merged into the original client');
echo "PASS a distinct submission sharing the same name/email is not blocked (no broad uniqueness rule)\n";

// A true race -- this request's up-front lookup sees no matching key, but
// a concurrent request's insert for the same key commits first, so this
// request's own insert collides on the unique index. It must recover by
// returning the row that won the race rather than erroring or duplicating.
$countBeforeRace = count($db->clients);
$db->forceDuplicateKeyOnNextInsert = true;
$raced = $service->create([
    'client_type' => 'individual',
    'display_name' => 'Race Condition',
    'primary_email' => 'race@example.test',
    'idempotency_key' => 'race-key',
]);
verifyClient(count($db->clients) === $countBeforeRace + 1, 'A raced duplicate-key insert produced more than the one winning row');
verifyClient($raced['display_name'] === 'Race Winner', 'Raced insert did not recover the row that won the race');
verifyClient(($raced['idempotent_replay'] ?? false) === true, 'Raced insert was not reported as a replay');
echo "PASS a raced duplicate-key insert recovers the winning row instead of erroring or duplicating\n";

// No idempotency key at all (a direct API caller that omits one) behaves
// exactly as before -- always creates a new client.
$countBeforeNoKey = count($db->clients);
$noKeyFirst = $service->create(['client_type' => 'individual', 'display_name' => 'No Key A', 'primary_email' => 'nokey.a@example.test']);
$noKeySecond = $service->create(['client_type' => 'individual', 'display_name' => 'No Key B', 'primary_email' => 'nokey.b@example.test']);
verifyClient($noKeyFirst['id'] !== $noKeySecond['id'], 'Omitting the idempotency key incorrectly merged two distinct clients');
verifyClient(count($db->clients) === $countBeforeNoKey + 2, 'Omitting the idempotency key did not create independent clients');
echo "PASS omitting the idempotency key preserves prior always-create behavior\n";
