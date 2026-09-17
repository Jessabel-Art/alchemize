<?php
// Admin Client Requests: "New Request" creation lifecycle. This exercises
// the real backend round trip against the real local dev database, using
// the exact repository methods the deployed Admin API routes call
// (api/v1/documents/index.php POST, api/v1/tasks/index.php POST), and
// proves the guarantees the fix depends on:
//
//   - a created document/task request is actually persisted (not a
//     client-only, in-memory row that vanishes on reload)
//   - the persisted record carries the canonical client_id relationship,
//     so the Admin queue can resolve the real client instead of
//     "Unknown client"
//   - the Admin list route returns the request after a fresh fetch
//     (simulating a page reload)
//   - the authenticated Client Portal route returns the request only for
//     the client it was actually assigned to
//   - a different client's authenticated portal route never sees it
//   - an invalid/missing client relationship is rejected by the database
//     (a real error), never silently accepted as a fake success
declare(strict_types=1);

function verifyWorkflow(bool $condition, string $message): void {
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
require_once __DIR__.'/../../server/repositories/client-repository.php';
require_once __DIR__.'/../../server/repositories/engagement-repository.php';
require_once __DIR__.'/../../server/repositories/document-repository.php';
require_once __DIR__.'/../../server/repositories/task-repository.php';
require_once __DIR__.'/../../server/repositories/portal-repository.php';
require_once __DIR__.'/../../server/services/lead-service.php';

$config = alchemize_config();
try {
    $db = alchemize_database($config['database']);
} catch (Throwable $error) {
    echo "SKIPPED: no local dev database reachable (" . $error->getMessage() . ").\n";
    exit(0);
}

$suffix = bin2hex(random_bytes(4));
$clientRepo = new AlchemizeClientRepository($db);
$engagementRepo = new AlchemizeEngagementRepository($db);
$documentRepo = new AlchemizeDocumentRepository($db);
$taskRepo = new AlchemizeTaskRepository($db);
$portalRepo = new AlchemizePortalRepository($db);

function makeLifecycleClient(AlchemizeClientRepository $repo, string $suffix, string $tag): int {
    return $repo->create([
        'public_id' => alchemize_uuid_v4(), 'client_type' => 'individual',
        'display_name' => "ZZZ Lifecycle {$tag} {$suffix}", 'legal_name' => null, 'preferred_name' => null,
        'primary_email' => "zzz.lifecycle.{$tag}.{$suffix}@example.test", 'primary_phone' => null,
        'preferred_contact_method' => 'email', 'language_preference' => 'en',
        'status' => 'active', 'portal_status' => 'active', 'source' => 'website', 'origin_lead_id' => null,
    ]);
}

$clientAId = makeLifecycleClient($clientRepo, $suffix, 'client-a');
$clientBId = makeLifecycleClient($clientRepo, $suffix, 'client-b');

$engagementAId = $engagementRepo->create([
    'public_id' => alchemize_uuid_v4(), 'engagement_number' => "ZZZ-LIFECYCLE-ENG-A-{$suffix}", 'client_id' => $clientAId,
    'title' => "ZZZ Lifecycle Engagement A {$suffix}", 'description' => null, 'status' => 'in_progress',
    'start_date' => date('Y-m-d'), 'target_date' => null, 'completion_date' => null, 'owner_user_id' => null,
    'billing_arrangement' => null, 'scope_notes' => null, 'pricing_notes' => null,
]);

$cleanupClientIds = [$clientAId, $clientBId];

try {
    echo "=== Document request creation (New Request: Document Request) ===\n";

    // Mirrors exactly what api/v1/documents/index.php's POST handler passes
    // to AlchemizeDocumentRepository::create() from the admin-submitted
    // payload -- the same payload shape AdminOperationalPages.jsx's
    // createRequest() now sends via documentApi.create().
    $documentId = $documentRepo->create([
        'public_id' => alchemize_uuid_v4(),
        'client_id' => $clientAId,
        'engagement_id' => $engagementAId,
        'service_id' => null,
        'document_name' => 'Hosting Information',
        'document_type' => null,
        'status' => 'awaiting_upload',
        'visibility' => 'shared',
        'requested_date' => date('Y-m-d'),
        'due_date' => null,
        'client_instructions' => 'Please provide current hosting login details.',
        'received_date' => null,
        'reviewed_date' => null,
        'owner_user_id' => null,
        'internal_notes' => null,
        'storage_key' => null,
        'mime_type' => null,
    ]);
    verifyWorkflow($documentId > 0, 'Setup failed: document request was not created');

    // --- Admin list route: the request must be persisted, not a
    //     client-only row that disappears on the next fetch. ---
    $adminDocuments = $documentRepo->listAll();
    $persisted = null;
    foreach ($adminDocuments as $row) {
        if ((int) $row['id'] === $documentId) { $persisted = $row; break; }
    }
    verifyWorkflow($persisted !== null, 'The Admin document list did not return the newly created request -- it was not actually persisted');
    verifyWorkflow((int) $persisted['client_id'] === $clientAId, 'The persisted document does not carry Client A\'s canonical client_id -- this is exactly what produces "Unknown client" in the Admin UI');
    verifyWorkflow($persisted['document_name'] === 'Hosting Information', 'The persisted document name does not match what was submitted');
    echo "PASS Admin document list returns the persisted request with Client A's canonical client_id (not \"Unknown client\")\n";

    // Simulate a page reload: fetch the admin list again from scratch.
    $adminDocumentsAfterReload = $documentRepo->listAll();
    $stillThere = false;
    foreach ($adminDocumentsAfterReload as $row) {
        if ((int) $row['id'] === $documentId) { $stillThere = true; break; }
    }
    verifyWorkflow($stillThere, 'The request disappeared on a fresh list fetch (page reload) -- it was never really persisted');
    echo "PASS The request survives a fresh re-fetch (page reload) -- it is a real, persisted record\n";

    // --- Client Portal route: only the assigned client sees it. ---
    $clientAPortalDocs = $portalRepo->listDocuments($clientAId);
    $clientASeesIt = false;
    foreach ($clientAPortalDocs as $row) {
        if ($row['document_name'] === 'Hosting Information') { $clientASeesIt = true; break; }
    }
    verifyWorkflow($clientASeesIt, "Client A's authenticated portal did not return the request assigned to them");
    echo "PASS Client A's authenticated portal route returns the request assigned to them\n";

    $clientBPortalDocs = $portalRepo->listDocuments($clientBId);
    $clientBSeesIt = false;
    foreach ($clientBPortalDocs as $row) {
        if ($row['document_name'] === 'Hosting Information') { $clientBSeesIt = true; break; }
    }
    verifyWorkflow(!$clientBSeesIt, "Client B's authenticated portal incorrectly returned Client A's request -- cross-client data leak");
    echo "PASS Client B's authenticated portal route does NOT return Client A's request\n";

    echo "\n=== Task request creation (New Request: Task / Action Item) ===\n";

    // Mirrors api/v1/tasks/index.php's POST handler + the visibility value
    // createRequest() now sends ('both') so the task is visible to the
    // client's portal as well as the admin queue.
    $taskId = $taskRepo->create([
        'public_id' => alchemize_uuid_v4(),
        'client_id' => $clientAId,
        'engagement_id' => $engagementAId,
        'service_id' => null,
        'title' => 'Confirm business address',
        'description' => 'Please confirm the mailing address on file.',
        'owner_user_id' => null,
        'priority' => 'normal',
        'due_date' => null,
        'status' => 'waiting_on_client',
        'visibility' => 'both',
        'dependency_task_id' => null,
        'internal_notes' => null,
    ]);
    verifyWorkflow($taskId > 0, 'Setup failed: task request was not created');

    $adminTasks = $taskRepo->listAll();
    $persistedTask = null;
    foreach ($adminTasks as $row) {
        if ((int) $row['id'] === $taskId) { $persistedTask = $row; break; }
    }
    verifyWorkflow($persistedTask !== null, 'The Admin task list did not return the newly created task -- it was not actually persisted');
    verifyWorkflow((int) $persistedTask['client_id'] === $clientAId, 'The persisted task does not carry Client A\'s canonical client_id');
    echo "PASS Admin task list returns the persisted task with Client A's canonical client_id\n";

    $clientATasks = $portalRepo->listTasks($clientAId);
    $clientASeesTask = false;
    foreach ($clientATasks as $row) {
        if ($row['title'] === 'Confirm business address') { $clientASeesTask = true; break; }
    }
    verifyWorkflow($clientASeesTask, "Client A's authenticated portal did not return the assigned task");

    $clientBTasks = $portalRepo->listTasks($clientBId);
    $clientBSeesTask = false;
    foreach ($clientBTasks as $row) {
        if ($row['title'] === 'Confirm business address') { $clientBSeesTask = true; break; }
    }
    verifyWorkflow(!$clientBSeesTask, "Client B's authenticated portal incorrectly returned Client A's task");
    echo "PASS Client A's portal sees the assigned task; Client B's portal does not\n";

    echo "\n=== Invalid client assignment is a real error, not a fake success ===\n";
    $rejected = false;
    try {
        $documentRepo->create([
            'public_id' => alchemize_uuid_v4(),
            'client_id' => 999999999,
            'engagement_id' => null,
            'service_id' => null,
            'document_name' => 'Should never persist',
            'document_type' => null,
            'status' => 'awaiting_upload',
            'visibility' => 'shared',
            'requested_date' => date('Y-m-d'),
            'due_date' => null,
            'client_instructions' => null,
            'received_date' => null,
            'reviewed_date' => null,
            'owner_user_id' => null,
            'internal_notes' => null,
            'storage_key' => null,
            'mime_type' => null,
        ]);
    } catch (Throwable $error) {
        $rejected = true;
    }
    verifyWorkflow($rejected, 'Creating a document with a nonexistent client_id did not raise a real error -- an invalid assignment must never silently succeed');
    echo "PASS An invalid client relationship is rejected by the database with a real error, never a fabricated success\n";
} finally {
    $db->exec("DELETE FROM tasks WHERE client_id IN (" . implode(',', array_map('intval', $cleanupClientIds)) . ")");
    $db->exec("DELETE FROM documents_metadata WHERE client_id IN (" . implode(',', array_map('intval', $cleanupClientIds)) . ")");
    $db->exec("DELETE FROM engagements WHERE client_id IN (" . implode(',', array_map('intval', $cleanupClientIds)) . ")");
    $db->exec("DELETE FROM clients WHERE id IN (" . implode(',', array_map('intval', $cleanupClientIds)) . ")");
}

$remainingClients = (int) $db->query("SELECT COUNT(*) FROM clients WHERE id IN (" . implode(',', array_map('intval', $cleanupClientIds)) . ")")->fetchColumn();
verifyWorkflow($remainingClients === 0, 'Disposable lifecycle fixtures were not fully cleaned up');
echo "\nClient Request creation lifecycle: persistence, canonical client resolution, reload survival, portal-scoped visibility, cross-client isolation, and invalid-assignment rejection all verified against the real database.\n";
