<?php
require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/validation/lead-validator.php';
require_once __DIR__.'/../../server/repositories/lead-repository.php';
require_once __DIR__.'/../../server/repositories/lead-contact-attempt-repository.php';
require_once __DIR__.'/../../server/repositories/lead-interest-repository.php';
require_once __DIR__.'/../../server/repositories/activity-repository.php';
require_once __DIR__.'/../../server/repositories/audit-event-repository.php';
require_once __DIR__.'/../../server/repositories/client-repository.php';
require_once __DIR__.'/../../server/services/lead-admin-service.php';

function alchemize_uuid_v4(): string {return 'test-uuid-'.bin2hex(random_bytes(6));}
function verifyLead(bool $condition, string $message): void {if(!$condition) throw new RuntimeException($message);}
function rejectsLead(callable $operation, string $code): void {try{$operation();}catch(AlchemizeRequestException $error){verifyLead($error->errorCode===$code,'Unexpected error: '.$error->errorCode);return;}throw new RuntimeException('Expected '.$code);}

// A repository-only require of note-repository.php is unavailable in this
// tree layout without pulling in its own PDO surface, so a minimal
// interface-compatible stub stands in — getLead() only needs an empty list.
final class AlchemizeNoteRepository {
    public function __construct(private PDO $database) {}
    public function listByEntity(string $entityType, string $entityId): array {return [];}
}

final class LeadPDO extends PDO {
    public array $leads = [];
    public array $clients = [];
    public array $activity = [];
    public array $audit = [];
    public int $nextLeadId = 1;
    public int $nextClientId = 1;
    public bool $transaction = false;
    private string $lastInsertTable = '';
    public function __construct(){}
    public function prepare(string $query, array $options = []): PDOStatement|false {return new LeadStatement($this, $query);}
    public function lastInsertId(?string $name = null): string|false {
        return $this->lastInsertTable === 'clients' ? (string)($this->nextClientId - 1) : (string)($this->nextLeadId - 1);
    }
    public function beginTransaction(): bool {$this->transaction = true; return true;}
    public function commit(): bool {$this->transaction = false; return true;}
    public function rollBack(): bool {$this->transaction = false; return true;}
    public function inTransaction(): bool {return $this->transaction;}
    public function markInsert(string $table): void {$this->lastInsertTable = $table;}
}

final class LeadStatement extends PDOStatement {
    private array $rows = [];
    public function __construct(private LeadPDO $db, private string $sql) {}
    public function execute(?array $params = null): bool {
        $q = $this->sql; $p = $params ?? []; $this->rows = [];
        if (str_contains($q, 'FROM leads') && str_contains($q, 'FOR UPDATE')) {
            $row = $this->db->leads[(int)$p['id']] ?? null;
            if ($row) $this->rows = [$row];
        } elseif (str_contains($q, 'FROM leads') && str_contains($q, 'WHERE id')) {
            $row = $this->db->leads[(int)$p['id']] ?? null;
            if ($row) $this->rows = [$row];
        } elseif (str_starts_with($q, 'INSERT INTO leads')) {
            $id = $this->db->nextLeadId++;
            $this->db->leads[$id] = ['id' => $id, 'public_id' => $p['public_id'], 'status' => $p['status'], 'client_id' => null] + $p;
            $this->db->markInsert('leads');
        } elseif (str_starts_with($q, 'UPDATE leads SET')) {
            $id = (int) $p['id']; unset($p['id']);
            $this->db->leads[$id] = array_replace($this->db->leads[$id], $p);
        } elseif (str_contains($q, 'FROM clients') && str_contains($q, 'WHERE id')) {
            $row = $this->db->clients[(int)$p['id']] ?? null;
            if ($row) $this->rows = [$row];
        } elseif (str_starts_with($q, 'INSERT INTO clients')) {
            $id = $this->db->nextClientId++;
            $this->db->clients[$id] = ['id' => $id, 'public_id' => $p['public_id']] + $p;
            $this->db->markInsert('clients');
        } elseif (str_starts_with($q, 'INSERT INTO activity_events')) {
            $this->db->activity[] = $p;
        } elseif (str_starts_with($q, 'INSERT INTO audit_events')) {
            $this->db->audit[] = $p;
        } elseif (str_contains($q, 'lead_contact_attempts') || str_contains($q, 'lead_service_interests')) {
            $this->rows = [];
        } else {
            throw new RuntimeException('Unexpected SQL: '.$q);
        }
        return true;
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed {return array_shift($this->rows) ?? false;}
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array {return $this->rows;}
}

$db = new LeadPDO();
$leadRepo = new AlchemizeLeadRepository($db);
$activityRepo = new AlchemizeActivityRepository($db);
$auditRepo = new AlchemizeAuditEventRepository($db);
$attemptRepo = new AlchemizeLeadContactAttemptRepository($db);
$interestRepo = new AlchemizeLeadInterestRepository($db);
$noteRepo = new AlchemizeNoteRepository($db);
$clientRepo = new AlchemizeClientRepository($db);
$service = new AlchemizeLeadAdminService($leadRepo, $activityRepo, $auditRepo, $attemptRepo, $interestRepo, $noteRepo, $clientRepo);

// Seed a prospect the same way an admin-created "Add record" prospect looks,
// including a real canonical service key (the exact field that used to be
// silently dropped as service_key: null).
$leadId = $leadRepo->create([
    'public_id' => alchemize_uuid_v4(),
    'full_name' => 'Jordan Rivera',
    'business_name' => 'Rivera Consulting',
    'email' => 'jordan@example.test',
    'phone' => '555-0100',
    'audience' => 'business',
    'service_key' => 'business-digital',
    'message' => 'Looking for a new site and ongoing support.',
    'preferred_contact' => 'email',
    'language_preference' => 'en',
    'status' => 'new',
    'source' => 'admin_manual_entry',
]);
verifyLead($db->leads[$leadId]['service_key'] === 'business-digital', 'Requested service was not persisted on the prospect');
verifyLead($db->leads[$leadId]['business_name'] === 'Rivera Consulting', 'Business name was not persisted on the prospect');

// An existing prospect can be opened, and its history/relationship fields
// (contact attempts, interests, notes) are present on the detail payload.
$opened = $service->getLead($leadId);
verifyLead($opened['full_name'] === 'Jordan Rivera', 'Opening the prospect did not return its stored data');
verifyLead(is_array($opened['contact_attempts']) && is_array($opened['interests']) && is_array($opened['notes']), 'Prospect detail is missing relationship history arrays');

// Prospect edits persist, including a corrected requested service.
$updated = $service->updateLead($leadId, [
    'full_name' => 'Jordan A. Rivera',
    'business_name' => 'Rivera Consulting Group',
    'email' => 'jordan@example.test',
    'phone' => '555-0101',
    'audience' => 'business',
    'service_key' => 'business-advisory',
    'message' => 'Looking for a new site, ongoing support, and an advisory session.',
]);
verifyLead($updated['full_name'] === 'Jordan A. Rivera', 'Full name edit did not persist');
verifyLead($updated['business_name'] === 'Rivera Consulting Group', 'Business name edit did not persist');
verifyLead($updated['phone'] === '555-0101', 'Phone edit did not persist');
verifyLead($updated['service_key'] === 'business-advisory', 'Requested service edit did not persist');

// A service key that does not match the chosen audience is rejected rather
// than silently saved (the same guard the public contact form enforces).
rejectsLead(fn() => $service->updateLead($leadId, ['audience' => 'individual', 'service_key' => 'business-advisory']), 'VALIDATION_ERROR');

// Convert to Client uses the existing backend lifecycle (POST /leads/{id}/convert),
// preserving name/email/phone/business name (-> legal_name) without requiring
// them to be resupplied, and without creating a second, unrelated person.
$conversion = $service->convertLead($leadId, ['client_type' => 'business'], 42);
verifyLead($conversion['status'] === 'converted', 'Conversion did not report converted status');
$newClientId = $conversion['new_client_id'];
$client = $db->clients[$newClientId];
verifyLead($client['display_name'] === 'Jordan A. Rivera', 'Converted client lost the prospect name');
verifyLead($client['primary_email'] === 'jordan@example.test', 'Converted client lost the prospect email');
verifyLead($client['primary_phone'] === '555-0101', 'Converted client lost the prospect phone');
verifyLead($client['legal_name'] === 'Rivera Consulting Group', 'Converted client lost the prospect business name');
verifyLead($client['origin_lead_id'] === $leadId, 'Converted client is not linked back to its originating prospect');
verifyLead($db->leads[$leadId]['status'] === 'converted', 'Prospect was not marked converted');
verifyLead($db->leads[$leadId]['client_id'] === $newClientId, 'Prospect is not linked to the client it became');
verifyLead(count($db->clients) === 1, 'Conversion created more than one client record');

// Re-converting the same prospect must fail rather than creating a duplicate person.
rejectsLead(fn() => $service->convertLead($leadId, [], 42), 'LEAD_ALREADY_CONVERTED');
verifyLead(count($db->clients) === 1, 'Re-conversion created a duplicate client record');

echo "Lead conversion: creation, requested-service persistence, prospect edits, audience/service validation, and Convert to Client (no duplicates) passed.\n";
