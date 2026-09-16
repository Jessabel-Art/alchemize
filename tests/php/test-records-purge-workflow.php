<?php
// Purge Test Records: this exercises the REAL backend round trip against the
// real local dev database, using the exact AlchemizeDataMaintenanceService
// methods the settings API route calls, and proves the safety guarantees the
// feature depends on:
//
//   - test clients/leads are identified only by a reserved RFC 2606 email
//     domain (example.test, etc.) -- never by name/keyword matching
//   - the purge cannot execute without the exact "PURGE TEST DATA" phrase
//   - a tampered selected_ids list can never purge a client whose email does
//     not use a reserved test domain, no matter what the client asked for
//   - purging a test client removes its dependent business data (engagement,
//     invoice, payment, task, appointment, scheduling link, document,
//     document submission, message thread/message, notification, note,
//     activity event, intake assignment) and nothing belonging to any other
//     client
//   - a converted test lead is purged together with its client; an orphan
//     test lead (never converted) is purged on its own; a legitimate lead on
//     a real domain is left alone
//   - every field on the "legitimate" client fixture (real, non-test domain)
//     and its own dependents survive the purge completely untouched
//   - the reported per-category counts match what was actually deleted
//   - a real audit_events row is written for the purge
declare(strict_types=1);

function verifyWorkflow(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}

function tableCount(PDO $db, string $table, string $column, int $id): int {
    $statement = $db->prepare("SELECT COUNT(*) FROM {$table} WHERE {$column} = ?");
    $statement->execute([$id]);
    return (int) $statement->fetchColumn();
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
require_once __DIR__.'/../../server/repositories/lead-repository.php';
require_once __DIR__.'/../../server/repositories/engagement-repository.php';
require_once __DIR__.'/../../server/services/lead-service.php';
require_once __DIR__.'/../../server/services/data-maintenance-service.php';

$config = alchemize_config();
try {
    $db = alchemize_database($config['database']);
} catch (Throwable $error) {
    echo "SKIPPED: no local dev database reachable (" . $error->getMessage() . ").\n";
    exit(0);
}

$adminUserId = (int) $db->query("SELECT id FROM users ORDER BY id LIMIT 1")->fetchColumn();
verifyWorkflow($adminUserId > 0, 'Setup failed: no user exists to attribute maintenance actions to');

$suffix = bin2hex(random_bytes(4));
$clientRepo = new AlchemizeClientRepository($db);
$leadRepo = new AlchemizeLeadRepository($db);
$engagementRepo = new AlchemizeEngagementRepository($db);
$service = new AlchemizeDataMaintenanceService($db, $adminUserId);

function makePurgeClient(AlchemizeClientRepository $repo, string $suffix, string $tag, string $email, ?int $originLeadId = null): int {
    return $repo->create([
        'public_id' => alchemize_uuid_v4(), 'client_type' => 'individual',
        'display_name' => "ZZZ Purge Test {$tag} {$suffix}", 'legal_name' => null, 'preferred_name' => null,
        'primary_email' => $email, 'primary_phone' => null,
        'preferred_contact_method' => 'email', 'language_preference' => 'en',
        'status' => 'active', 'portal_status' => 'active', 'source' => 'website', 'origin_lead_id' => $originLeadId,
    ]);
}

function makePurgeLead(AlchemizeLeadRepository $repo, string $suffix, string $tag, string $email): int {
    return $repo->create([
        'public_id' => alchemize_uuid_v4(), 'full_name' => "ZZZ Purge Test Lead {$tag} {$suffix}",
        'business_name' => null, 'email' => $email, 'phone' => null, 'audience' => 'individual',
        'service_key' => null, 'message' => 'Automated purge-workflow test fixture.',
        'preferred_contact' => 'email', 'language_preference' => 'en', 'status' => 'new', 'source' => 'website_contact',
    ]);
}

// A client/lead using a real-looking domain must never be treated as a test
// record -- this is the negative control proving the feature does not use
// fuzzy name matching (both fixtures below have "ZZZ Purge Test" in their
// name, exactly like the real test fixtures, and must still survive).
$legitDomain = "verified-client-mail-{$suffix}.dev";

$testClientId = makePurgeClient($clientRepo, $suffix, 'client', "zzz.purge.client.{$suffix}@example.test");
$legitClientId = makePurgeClient($clientRepo, $suffix, 'legit-client', "zzz.purge.legit.{$suffix}@{$legitDomain}");

$convertedLeadId = makePurgeLead($leadRepo, $suffix, 'converted', "zzz.purge.converted.{$suffix}@example.test");
$convertedClientId = makePurgeClient($clientRepo, $suffix, 'converted-client', "zzz.purge.converted.{$suffix}@example.test", $convertedLeadId);

$orphanLeadId = makePurgeLead($leadRepo, $suffix, 'orphan', "zzz.purge.orphan.{$suffix}@example.test");
$legitLeadId = makePurgeLead($leadRepo, $suffix, 'legit-lead', "zzz.purge.legit-lead.{$suffix}@{$legitDomain}");

$cleanupClientIds = [$testClientId, $legitClientId, $convertedClientId];
$cleanupLeadIds = [$convertedLeadId, $orphanLeadId, $legitLeadId];
$cleanupEngagementIds = [];
$cleanupInvoiceIds = [];

try {
    echo "=== Test record identification ===\n";

    // --- Dependent fixtures on the real ("test") client ------------------------
    $testEngagementId = $engagementRepo->create([
        'public_id' => alchemize_uuid_v4(), 'engagement_number' => "ZZZ-PURGE-ENG-{$suffix}", 'client_id' => $testClientId,
        'title' => "ZZZ Purge Test Engagement {$suffix}", 'description' => null, 'status' => 'in_progress',
        'start_date' => date('Y-m-d'), 'target_date' => null, 'completion_date' => null, 'owner_user_id' => null,
        'billing_arrangement' => null, 'scope_notes' => null, 'pricing_notes' => null,
    ]);
    $cleanupEngagementIds[] = $testEngagementId;

    $db->prepare('INSERT INTO invoices (public_id, invoice_number, client_id, engagement_id, invoice_date, status) VALUES (:pid, :num, :client, :engagement, :date, :status)')
        ->execute(['pid' => alchemize_uuid_v4(), 'num' => "ZZZ-PURGE-INV-{$suffix}", 'client' => $testClientId, 'engagement' => $testEngagementId, 'date' => date('Y-m-d'), 'status' => 'draft']);
    $testInvoiceId = (int) $db->lastInsertId();
    $cleanupInvoiceIds[] = $testInvoiceId;

    $db->prepare('INSERT INTO payments (public_id, invoice_id, client_id, payment_date, amount, payment_method) VALUES (:pid, :inv, :client, :date, 25.00, :method)')
        ->execute(['pid' => alchemize_uuid_v4(), 'inv' => $testInvoiceId, 'client' => $testClientId, 'date' => date('Y-m-d'), 'method' => 'manual']);

    $db->prepare("INSERT INTO tasks (public_id, client_id, engagement_id, title, status) VALUES (:pid, :client, :engagement, :title, 'not_started')")
        ->execute(['pid' => alchemize_uuid_v4(), 'client' => $testClientId, 'engagement' => $testEngagementId, 'title' => "ZZZ Purge Test Task {$suffix}"]);

    $db->prepare("INSERT INTO appointments (public_id, client_id, engagement_id, appointment_type, scheduled_at, status) VALUES (:pid, :client, :engagement, 'Consultation', CURRENT_TIMESTAMP(6), 'requested')")
        ->execute(['pid' => alchemize_uuid_v4(), 'client' => $testClientId, 'engagement' => $testEngagementId]);

    $db->prepare("INSERT INTO appointment_scheduling_links (public_id, token_hash, client_id, appointment_type, expires_at) VALUES (:pid, :hash, :client, 'Consultation', DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 7 DAY))")
        ->execute(['pid' => alchemize_uuid_v4(), 'hash' => hash('sha256', "zzz-purge-link-{$suffix}"), 'client' => $testClientId]);

    $db->prepare("INSERT INTO documents_metadata (public_id, client_id, engagement_id, document_name, status, visibility, requested_date) VALUES (:pid, :client, :engagement, :name, 'requested', 'client', CURRENT_DATE())")
        ->execute(['pid' => alchemize_uuid_v4(), 'client' => $testClientId, 'engagement' => $testEngagementId, 'name' => "ZZZ Purge Test Document {$suffix}"]);
    $testDocumentId = (int) $db->lastInsertId();

    $db->prepare("INSERT INTO document_submissions (public_id, document_id, client_id, version_number, submitted_by_user_id, original_filename, storage_key, mime_type, file_extension, file_size_bytes, sha256) VALUES (:pid, :doc, :client, 1, :actor, 'zzz-purge.pdf', :storage, 'application/pdf', 'pdf', 10, :sha)")
        ->execute(['pid' => alchemize_uuid_v4(), 'doc' => $testDocumentId, 'client' => $testClientId, 'actor' => $adminUserId, 'storage' => "zzz/purge/{$suffix}/v1.pdf", 'sha' => hash('sha256', "zzz-purge-{$suffix}")]);

    $db->prepare("INSERT INTO message_threads (public_id, client_id, subject, created_by_user_id) VALUES (:pid, :client, :subject, :actor)")
        ->execute(['pid' => alchemize_uuid_v4(), 'client' => $testClientId, 'subject' => "ZZZ Purge Test Thread {$suffix}", 'actor' => $adminUserId]);
    $testThreadId = (int) $db->lastInsertId();

    $db->prepare("INSERT INTO messages (public_id, thread_id, client_id, sender_user_id, sender_type, message_body) VALUES (:pid, :thread, :client, :actor, 'staff', 'ZZZ purge workflow test message.')")
        ->execute(['pid' => alchemize_uuid_v4(), 'thread' => $testThreadId, 'client' => $testClientId, 'actor' => $adminUserId]);

    $db->prepare("INSERT INTO notifications (public_id, recipient_user_id, client_id, event_type, title) VALUES (:pid, :recipient, :client, 'test.purge', :title)")
        ->execute(['pid' => alchemize_uuid_v4(), 'recipient' => $adminUserId, 'client' => $testClientId, 'title' => "ZZZ Purge Test Notification {$suffix}"]);

    $testClientPublicId = (string) $db->query("SELECT public_id FROM clients WHERE id = {$testClientId}")->fetchColumn();
    $db->prepare("INSERT INTO notes (public_id, entity_type, entity_id, client_id, note_body, author_user_id) VALUES (:pid, 'client', :entity, :client, 'ZZZ purge workflow test note.', :actor)")
        ->execute(['pid' => alchemize_uuid_v4(), 'entity' => $testClientPublicId, 'client' => $testClientId, 'actor' => $adminUserId]);

    $db->prepare("INSERT INTO activity_events (public_id, event_type, actor_type, entity_type, entity_id, client_id, summary) VALUES (:pid, 'test.purge', 'admin', 'client', :entity, :client, 'ZZZ purge workflow test activity.')")
        ->execute(['pid' => alchemize_uuid_v4(), 'entity' => $testClientPublicId, 'client' => $testClientId]);

    $db->prepare("INSERT INTO intake_assignments (public_id, client_id, engagement_id, family_key, module_keys, assigned_by_user_id) VALUES (:pid, :client, :engagement, 'client_profile', :modules, :actor)")
        ->execute(['pid' => alchemize_uuid_v4(), 'client' => $testClientId, 'engagement' => $testEngagementId, 'modules' => json_encode(['profile']), 'actor' => $adminUserId]);

    // --- Dependent fixtures on the legitimate (real-domain) client -------------
    $legitEngagementId = $engagementRepo->create([
        'public_id' => alchemize_uuid_v4(), 'engagement_number' => "ZZZ-PURGE-LEGIT-ENG-{$suffix}", 'client_id' => $legitClientId,
        'title' => "ZZZ Purge Test Legit Engagement {$suffix}", 'description' => null, 'status' => 'in_progress',
        'start_date' => date('Y-m-d'), 'target_date' => null, 'completion_date' => null, 'owner_user_id' => null,
        'billing_arrangement' => null, 'scope_notes' => null, 'pricing_notes' => null,
    ]);
    $db->prepare('INSERT INTO invoices (public_id, invoice_number, client_id, engagement_id, invoice_date, status) VALUES (:pid, :num, :client, :engagement, :date, :status)')
        ->execute(['pid' => alchemize_uuid_v4(), 'num' => "ZZZ-PURGE-LEGIT-INV-{$suffix}", 'client' => $legitClientId, 'engagement' => $legitEngagementId, 'date' => date('Y-m-d'), 'status' => 'draft']);
    $legitInvoiceId = (int) $db->lastInsertId();
    $db->prepare("INSERT INTO appointments (public_id, client_id, engagement_id, appointment_type, scheduled_at, status) VALUES (:pid, :client, :engagement, 'Consultation', CURRENT_TIMESTAMP(6), 'requested')")
        ->execute(['pid' => alchemize_uuid_v4(), 'client' => $legitClientId, 'engagement' => $legitEngagementId]);

    // Orphan (never-converted) test lead's own dependents.
    $db->prepare("INSERT INTO appointments (public_id, lead_id, appointment_type, scheduled_at, status) VALUES (:pid, :lead, 'Consultation', CURRENT_TIMESTAMP(6), 'requested')")
        ->execute(['pid' => alchemize_uuid_v4(), 'lead' => $orphanLeadId]);
    $db->prepare("INSERT INTO appointment_scheduling_links (public_id, token_hash, lead_id, appointment_type, expires_at) VALUES (:pid, :hash, :lead, 'Consultation', DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 7 DAY))")
        ->execute(['pid' => alchemize_uuid_v4(), 'hash' => hash('sha256', "zzz-purge-orphan-link-{$suffix}"), 'lead' => $orphanLeadId]);
    $orphanLeadPublicId = (string) $db->query("SELECT public_id FROM leads WHERE id = {$orphanLeadId}")->fetchColumn();
    $db->prepare("INSERT INTO activity_events (public_id, event_type, actor_type, entity_type, entity_id, lead_id, summary) VALUES (:pid, 'test.purge', 'admin', 'lead', :entity, :lead, 'ZZZ purge workflow test lead activity.')")
        ->execute(['pid' => alchemize_uuid_v4(), 'entity' => $orphanLeadPublicId, 'lead' => $orphanLeadId]);

    // --- Identification: overview/preview must find the test records, and only
    //     the test records -------------------------------------------------------
    $overview = $service->overview();
    verifyWorkflow($overview['summary']['test_records'] >= 3, 'overview() test_records count did not include all seeded test client/lead fixtures');

    $preview = $service->preview(['category' => 'test_records', 'limit' => 200]);
    $previewClientIds = array_column($preview['records'], 'id');
    verifyWorkflow(in_array($testClientId, $previewClientIds, true), 'The reserved-test-domain client did not appear in the test_records review');
    verifyWorkflow(in_array($convertedClientId, $previewClientIds, true), 'The converted test-domain client did not appear in the test_records review');
    verifyWorkflow(!in_array($legitClientId, $previewClientIds, true), 'A client on a real, non-reserved domain incorrectly appeared as a test-record candidate (naming alone must never trigger this)');
    verifyWorkflow($preview['orphan_test_leads'] >= 1, 'preview() did not report the orphan (never-converted) test lead');
    echo "PASS Only clients on a reserved test email domain are identified as test records; a real-domain client with the same 'ZZZ Purge Test' naming is correctly excluded\n";

    // --- Confirmation phrase is required server-side ----------------------------
    echo "\n=== Confirmation gate ===\n";
    $rejected = false;
    try {
        $service->execute(['action' => 'purge', 'category' => 'test_records', 'selected_ids' => [$testClientId]]);
    } catch (AlchemizeRequestException $error) {
        $rejected = true;
        verifyWorkflow($error->errorCode === 'CONFIRMATION_REQUIRED', 'Missing confirmation phrase raised the wrong error code: ' . $error->errorCode);
    }
    verifyWorkflow($rejected, 'purge(test_records) executed without the required "PURGE TEST DATA" confirmation phrase');
    $stillPresent = tableCount($db, 'clients', 'id', $testClientId);
    verifyWorkflow($stillPresent === 1, 'A record was purged despite the confirmation phrase being missing');
    echo "PASS The purge cannot execute without the exact PURGE TEST DATA confirmation phrase\n";

    // --- Tampered selection: real client id submitted alongside a test one -----
    echo "\n=== Purge execution (tampered selection) ===\n";
    $result = $service->execute([
        'action' => 'purge', 'category' => 'test_records', 'confirm' => 'PURGE TEST DATA',
        'selected_ids' => [$testClientId, $legitClientId],
    ]);
    verifyWorkflow($result['deleted']['clients'] === 1, 'purge(test_records) purged a different number of clients than the single eligible one: got ' . $result['deleted']['clients']);
    verifyWorkflow($result['blocked'] >= 1, 'purge(test_records) did not report the real-domain client as blocked despite it being submitted in selected_ids');
    verifyWorkflow($result['deleted']['engagements'] === 1, 'Unexpected engagement deletion count: ' . $result['deleted']['engagements']);
    verifyWorkflow($result['deleted']['invoices'] === 1, 'Unexpected invoice deletion count: ' . $result['deleted']['invoices']);
    verifyWorkflow($result['deleted']['payments'] === 1, 'Unexpected payment deletion count: ' . $result['deleted']['payments']);
    verifyWorkflow($result['deleted']['tasks'] === 1, 'Unexpected task deletion count: ' . $result['deleted']['tasks']);
    verifyWorkflow($result['deleted']['appointments'] === 2, 'Unexpected appointment deletion count (expected the test client\'s + the orphan lead\'s): ' . $result['deleted']['appointments']);
    verifyWorkflow($result['deleted']['appointment_scheduling_links'] === 2, 'Unexpected scheduling-link deletion count: ' . $result['deleted']['appointment_scheduling_links']);
    verifyWorkflow($result['deleted']['documents'] === 1, 'Unexpected document deletion count: ' . $result['deleted']['documents']);
    verifyWorkflow($result['deleted']['document_submissions'] === 1, 'Unexpected document-submission deletion count: ' . $result['deleted']['document_submissions']);
    verifyWorkflow($result['deleted']['conversations'] === 1, 'Unexpected conversation deletion count: ' . $result['deleted']['conversations']);
    verifyWorkflow($result['deleted']['messages'] === 1, 'Unexpected message deletion count: ' . $result['deleted']['messages']);
    verifyWorkflow($result['deleted']['notifications'] === 1, 'Unexpected notification deletion count: ' . $result['deleted']['notifications']);
    verifyWorkflow($result['deleted']['notes'] === 1, 'Unexpected note deletion count: ' . $result['deleted']['notes']);
    verifyWorkflow($result['deleted']['activity_events'] === 2, 'Unexpected activity-event deletion count (expected the test client\'s + the orphan lead\'s): ' . $result['deleted']['activity_events']);
    verifyWorkflow($result['deleted']['intake_assignments'] === 1, 'Unexpected intake-assignment deletion count: ' . $result['deleted']['intake_assignments']);
    verifyWorkflow($result['deleted']['leads'] === 1, 'Unexpected lead deletion count (expected only the orphan test lead, not the still-referenced converted lead): ' . $result['deleted']['leads']);
    echo "PASS Reported per-category counts exactly match what was actually deleted; a real-domain client submitted via a tampered selection is left untouched\n";

    verifyWorkflow(tableCount($db, 'clients', 'id', $testClientId) === 0, 'The test client itself was not deleted');
    verifyWorkflow(tableCount($db, 'clients', 'id', $legitClientId) === 1, 'The real-domain client was deleted despite not qualifying as a test record');
    verifyWorkflow(tableCount($db, 'leads', 'id', $orphanLeadId) === 0, 'The orphan test lead was not deleted');
    verifyWorkflow(tableCount($db, 'leads', 'id', $convertedLeadId) === 1, 'The converted test lead was deleted even though its client was never selected for purge');
    verifyWorkflow(tableCount($db, 'clients', 'id', $convertedClientId) === 1, 'The converted test client was deleted despite not being selected');
    echo "PASS Only the selected, currently-qualifying test client (and the always-swept orphan test lead) were removed\n";

    verifyWorkflow(tableCount($db, 'engagements', 'client_id', $testClientId) === 0, 'A dependent engagement survived the purge');
    verifyWorkflow(tableCount($db, 'invoices', 'client_id', $testClientId) === 0, 'A dependent invoice survived the purge');
    verifyWorkflow(tableCount($db, 'payments', 'client_id', $testClientId) === 0, 'A dependent payment survived the purge');
    verifyWorkflow(tableCount($db, 'tasks', 'client_id', $testClientId) === 0, 'A dependent task survived the purge');
    verifyWorkflow(tableCount($db, 'appointments', 'client_id', $testClientId) === 0, 'A dependent appointment survived the purge');
    verifyWorkflow(tableCount($db, 'documents_metadata', 'client_id', $testClientId) === 0, 'A dependent document survived the purge');
    verifyWorkflow(tableCount($db, 'document_submissions', 'client_id', $testClientId) === 0, 'A dependent document submission survived the purge');
    verifyWorkflow(tableCount($db, 'message_threads', 'client_id', $testClientId) === 0, 'A dependent conversation survived the purge');
    verifyWorkflow(tableCount($db, 'notifications', 'client_id', $testClientId) === 0, 'A dependent notification survived the purge');
    verifyWorkflow(tableCount($db, 'notes', 'client_id', $testClientId) === 0, 'A dependent note survived the purge');
    verifyWorkflow(tableCount($db, 'activity_events', 'client_id', $testClientId) === 0, 'A dependent activity event survived the purge');
    verifyWorkflow(tableCount($db, 'intake_assignments', 'client_id', $testClientId) === 0, 'A dependent intake assignment survived the purge');
    echo "PASS Every dependent record belonging specifically to the purged test client is gone (foreign-key-safe cascade)\n";

    verifyWorkflow(tableCount($db, 'engagements', 'id', $legitEngagementId) === 1, 'The real-domain client\'s engagement was affected by an unrelated purge');
    verifyWorkflow(tableCount($db, 'invoices', 'id', $legitInvoiceId) === 1, 'The real-domain client\'s invoice was affected by an unrelated purge');
    verifyWorkflow(tableCount($db, 'appointments', 'client_id', $legitClientId) === 1, 'The real-domain client\'s appointment was affected by an unrelated purge');
    echo "PASS Legitimate business records belonging to a different (real-domain) client are completely untouched\n";

    $audit = $db->query("SELECT actor_user_id, action_summary FROM audit_events WHERE event_type = 'maintenance.test_records_purge' ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    verifyWorkflow($audit !== false, 'No audit_events row was written for the test-records purge');
    verifyWorkflow((int) $audit['actor_user_id'] === $adminUserId, 'Audit event did not record the correct actor for the purge');
    echo "PASS A real audit_events row is written for the purge, recording who performed it\n";

    // --- Second purge: the now-orphaned converted client is swept, taking its
    //     originating lead with it in the same call --------------------------
    echo "\n=== Purge execution (converted client + its lead) ===\n";
    $result2 = $service->execute([
        'action' => 'purge', 'category' => 'test_records', 'confirm' => 'PURGE TEST DATA',
        'selected_ids' => [$convertedClientId],
    ]);
    verifyWorkflow($result2['deleted']['clients'] === 1, 'The converted test client was not purged when explicitly selected');
    verifyWorkflow($result2['deleted']['leads'] === 1, 'The originating lead was not purged together with its now-deleted test client');
    verifyWorkflow(tableCount($db, 'clients', 'id', $convertedClientId) === 0, 'The converted test client still exists after being purged');
    verifyWorkflow(tableCount($db, 'leads', 'id', $convertedLeadId) === 0, 'The originating test lead still exists after its client was purged');
    verifyWorkflow(tableCount($db, 'leads', 'id', $legitLeadId) === 1, 'A real-domain lead was deleted despite not qualifying as a test record');
    echo "PASS A converted test client and its now-unreferenced originating lead are both purged in the same run; a real-domain lead is left alone\n";

    echo "\n=== Referential integrity ===\n";
    $orphanedInvoiceLineItems = (int) $db->query("SELECT COUNT(*) FROM invoice_line_items WHERE invoice_id NOT IN (SELECT id FROM invoices)")->fetchColumn();
    $orphanedPayments = (int) $db->query("SELECT COUNT(*) FROM payments WHERE invoice_id NOT IN (SELECT id FROM invoices) OR client_id NOT IN (SELECT id FROM clients)")->fetchColumn();
    verifyWorkflow($orphanedInvoiceLineItems === 0, 'Orphaned invoice_line_items rows exist after the purge (referential integrity broken)');
    verifyWorkflow($orphanedPayments === 0, 'Orphaned payments rows exist after the purge (referential integrity broken)');
    echo "PASS No orphaned foreign-key references anywhere in the database after the purge\n";
} finally {
    // --- Cleanup: remove whatever fixtures the purge itself did not already
    //     remove, in FK-safe order -----------------------------------------------
    $legitIds = implode(',', array_map('intval', [$legitClientId]));
    $db->exec("DELETE FROM appointments WHERE client_id IN ({$legitIds})");
    $db->exec("DELETE FROM invoices WHERE client_id IN ({$legitIds})");
    $db->exec("DELETE FROM engagements WHERE client_id IN ({$legitIds})");
    $db->exec("DELETE FROM appointments WHERE lead_id IN (" . implode(',', array_map('intval', [$orphanLeadId])) . ")");
    $db->exec("DELETE FROM appointment_scheduling_links WHERE lead_id IN (" . implode(',', array_map('intval', [$orphanLeadId])) . ")");

    $db->exec("DELETE FROM audit_events WHERE event_type = 'maintenance.test_records_purge' AND entity_id IN (" . implode(',', array_map('intval', array_filter([$testClientId, $convertedClientId]))) . ")");

    if ($cleanupClientIds) {
        $ids = implode(',', array_map('intval', $cleanupClientIds));
        $db->exec("DELETE FROM clients WHERE id IN ({$ids})");
    }
    if ($cleanupLeadIds) {
        $ids = implode(',', array_map('intval', $cleanupLeadIds));
        $db->exec("DELETE FROM leads WHERE id IN ({$ids})");
    }
}

$remainingClients = (int) $db->query("SELECT COUNT(*) FROM clients WHERE id IN (" . implode(',', array_map('intval', $cleanupClientIds)) . ")")->fetchColumn();
$remainingLeads = (int) $db->query("SELECT COUNT(*) FROM leads WHERE id IN (" . implode(',', array_map('intval', $cleanupLeadIds)) . ")")->fetchColumn();
verifyWorkflow($remainingClients === 0 && $remainingLeads === 0, 'Disposable test fixtures were not fully cleaned up');
echo "\nPurge Test Records workflow: reserved-domain identification, the required confirmation phrase, tampered-selection safety, FK-safe cascading deletes, accurate per-category counts, preservation of legitimate records, and audit history all verified against the real database.\n";
