<?php
// Communications Center: Admin <-> Client Portal message threads must not be
// considered verified just because the Admin/Client UI's own state changed.
// This test exercises the REAL backend round trip end to end, against the
// real local dev database, using the exact repository/service methods the
// deployed Admin and Client Portal API routes call:
//
//   Admin sends (new thread)     -> AlchemizePortalAdminService::startThread()
//   Client reads it              -> AlchemizePortalActionService::thread()
//   Client replies               -> AlchemizePortalActionService::sendMessage()
//                                    (AlchemizePortalActionRepository::createMessage()
//                                    unconditionally sets status=waiting_on_alchemize)
//   Admin reads/sees the reply   -> AlchemizePortalAdminService::thread()/threads()
//   Admin sets Waiting on Client -> AlchemizePortalAdminService::updateThread()
//   Client replies again         -> verifies the same auto-transition back to
//                                    waiting_on_alchemize
//   Admin resolves / archives /
//   restores                     -> AlchemizePortalAdminService::updateThread()
//   Related-record linking       -> AlchemizePortalAdminService::linkThread()
//                                    (AlchemizePortalAdminRepository::linkThread()
//                                    rejects a record belonging to another client)
//
// It proves persisted database state and the opposite-portal read, not just
// one side's in-memory return value -- matching the requirement that these
// workflows are verified end to end, not assumed from frontend state alone.
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
require_once __DIR__.'/../../server/validation/lead-validator.php';
require_once __DIR__.'/../../server/services/lead-service.php';
require_once __DIR__.'/../../server/repositories/client-repository.php';
require_once __DIR__.'/../../server/repositories/engagement-repository.php';
require_once __DIR__.'/../../server/repositories/user-repository.php';
require_once __DIR__.'/../../server/repositories/role-repository.php';
require_once __DIR__.'/../../server/repositories/portal-account-repository.php';
require_once __DIR__.'/../../server/repositories/portal-admin-repository.php';
require_once __DIR__.'/../../server/repositories/portal-action-repository.php';
require_once __DIR__.'/../../server/repositories/activity-repository.php';
require_once __DIR__.'/../../server/repositories/audit-event-repository.php';
require_once __DIR__.'/../../server/repositories/notification-repository.php';
require_once __DIR__.'/../../server/services/notification-service.php';
require_once __DIR__.'/../../server/services/document-storage-service.php';
require_once __DIR__.'/../../server/services/google-client-factory.php';
require_once __DIR__.'/../../server/services/google-drive-service.php';
require_once __DIR__.'/../../server/services/google-calendar-service.php';
require_once __DIR__.'/../../server/repositories/external-integration-repository.php';
require_once __DIR__.'/../../server/services/external-integration-service.php';
require_once __DIR__.'/../../server/services/portal-account-service.php';
require_once __DIR__.'/../../server/services/portal-admin-service.php';
require_once __DIR__.'/../../server/services/portal-action-service.php';

$config = alchemize_config();
try {
    $db = alchemize_database($config['database']);
} catch (Throwable $error) {
    echo "SKIPPED: no local dev database reachable (" . $error->getMessage() . ").\n";
    exit(0);
}

// --- Fixtures: disposable clients/engagements/users, cleaned up at the end ---
$adminUserId = (int) $db->query("SELECT id FROM users ORDER BY id LIMIT 1")->fetchColumn();
verifyWorkflow($adminUserId > 0, 'Setup failed: no user exists in the local dev database to attribute admin actions to');
$clientRoleId = (int) $db->query("SELECT id FROM roles WHERE slug = 'client' LIMIT 1")->fetchColumn();
verifyWorkflow($clientRoleId > 0, "Setup failed: no 'client' role exists in the local dev database");

$clientRepo = new AlchemizeClientRepository($db);
$engagementRepo = new AlchemizeEngagementRepository($db);
$userRepo = new AlchemizeUserRepository($db);

$suffix = bin2hex(random_bytes(4));
$clientId = $clientRepo->create([
    'public_id' => alchemize_uuid_v4(), 'client_type' => 'individual',
    'display_name' => "ZZZ Comms Test {$suffix}", 'legal_name' => null, 'preferred_name' => null,
    'primary_email' => "zzz.comms.test.{$suffix}@example.test", 'primary_phone' => null,
    'preferred_contact_method' => 'email', 'language_preference' => 'en',
    'status' => 'active', 'portal_status' => 'active', 'source' => 'website', 'origin_lead_id' => null,
]);
verifyWorkflow($clientId > 0, 'Setup failed: could not create disposable test client');

$otherClientId = $clientRepo->create([
    'public_id' => alchemize_uuid_v4(), 'client_type' => 'individual',
    'display_name' => "ZZZ Comms Test Other {$suffix}", 'legal_name' => null, 'preferred_name' => null,
    'primary_email' => "zzz.comms.test.other.{$suffix}@example.test", 'primary_phone' => null,
    'preferred_contact_method' => 'email', 'language_preference' => 'en',
    'status' => 'active', 'portal_status' => 'active', 'source' => 'website', 'origin_lead_id' => null,
]);
verifyWorkflow($otherClientId > 0, 'Setup failed: could not create disposable second test client');

$clientUserId = $userRepo->create([
    'public_id' => alchemize_uuid_v4(), 'email' => "zzz.comms.test.user.{$suffix}@example.test",
    'password_hash' => null, 'display_name' => "ZZZ Comms Test {$suffix}", 'status' => 'active',
    'role_id' => $clientRoleId,
]);
verifyWorkflow($clientUserId > 0, 'Setup failed: could not create disposable test client user');

$engagementId = $engagementRepo->create([
    'public_id' => alchemize_uuid_v4(), 'engagement_number' => "ZZZ-COMMS-{$suffix}", 'client_id' => $clientId,
    'title' => "ZZZ Comms Test Engagement {$suffix}", 'description' => null, 'status' => 'in_progress',
    'start_date' => date('Y-m-d'), 'target_date' => null, 'completion_date' => null, 'owner_user_id' => null,
    'billing_arrangement' => null, 'scope_notes' => null, 'pricing_notes' => null,
]);
verifyWorkflow($engagementId > 0, 'Setup failed: could not create disposable test engagement');
$engagementPublicId = (string) $db->query("SELECT public_id FROM engagements WHERE id = {$engagementId}")->fetchColumn();

$otherEngagementId = $engagementRepo->create([
    'public_id' => alchemize_uuid_v4(), 'engagement_number' => "ZZZ-COMMS-OTHER-{$suffix}", 'client_id' => $otherClientId,
    'title' => "ZZZ Comms Test Other Engagement {$suffix}", 'description' => null, 'status' => 'in_progress',
    'start_date' => date('Y-m-d'), 'target_date' => null, 'completion_date' => null, 'owner_user_id' => null,
    'billing_arrangement' => null, 'scope_notes' => null, 'pricing_notes' => null,
]);
verifyWorkflow($otherEngagementId > 0, 'Setup failed: could not create disposable second test engagement');
$otherEngagementPublicId = (string) $db->query("SELECT public_id FROM engagements WHERE id = {$otherEngagementId}")->fetchColumn();

$threadId = null;
$cleanup = function () use ($db, &$threadId, $clientId, $otherClientId, $clientUserId, $engagementId, $otherEngagementId) {
    if ($threadId !== null) {
        $db->prepare('DELETE FROM messages WHERE thread_id = (SELECT id FROM message_threads WHERE public_id = :id)')->execute(['id' => $threadId]);
        $db->prepare('DELETE FROM message_threads WHERE public_id = :id')->execute(['id' => $threadId]);
        $db->prepare('DELETE FROM activity_events WHERE entity_type = "message_thread" AND entity_id = :id')->execute(['id' => $threadId]);
        $db->prepare('DELETE FROM audit_events WHERE entity_type = "message_thread" AND entity_id = :id')->execute(['id' => $threadId]);
        $db->prepare('DELETE FROM notifications WHERE related_entity_type = "message_thread" AND related_entity_id = :id')->execute(['id' => $threadId]);
    }
    $db->prepare('DELETE FROM notifications WHERE client_id IN (:c1, :c2)')->execute(['c1' => $clientId, 'c2' => $otherClientId]);
    $db->prepare('DELETE FROM engagement_service_items WHERE engagement_id IN (:e1, :e2)')->execute(['e1' => $engagementId, 'e2' => $otherEngagementId]);
    $db->prepare('DELETE FROM engagements WHERE id IN (:e1, :e2)')->execute(['e1' => $engagementId, 'e2' => $otherEngagementId]);
    $db->prepare('DELETE FROM users WHERE id = :id')->execute(['id' => $clientUserId]);
    $db->prepare('DELETE FROM clients WHERE id IN (:c1, :c2)')->execute(['c1' => $clientId, 'c2' => $otherClientId]);
};

try {
    $activityRepo = new AlchemizeActivityRepository($db);
    $auditRepo = new AlchemizeAuditEventRepository($db);
    $notifRepo = new AlchemizeNotificationRepository($db);
    $notifService = new AlchemizeNotificationService($notifRepo, new AlchemizeNullEmailProvider());
    $accountService = new AlchemizePortalAccountService(
        $db, $userRepo, new AlchemizeRoleRepository($db), new AlchemizePortalAccountRepository($db), $config
    );
    $integrations = alchemize_external_integrations($db, $config);

    $adminRepo = new AlchemizePortalAdminRepository($db);
    $adminService = new AlchemizePortalAdminService($adminRepo, $activityRepo, $auditRepo, $notifService, $accountService, $integrations);

    $clientActionRepo = new AlchemizePortalActionRepository($db);
    $clientService = new AlchemizePortalActionService(
        $clientActionRepo, $activityRepo, $auditRepo,
        new AlchemizeDocumentStorageService((string) $config['document_storage_root']),
        $notifService, $integrations,
    );

    $adminUser = ['user_id' => $adminUserId];
    $clientAccess = [
        'client_id' => $clientId, 'access_role' => 'primary_contact',
        'display_name' => "ZZZ Comms Test {$suffix}", 'primary_email' => "zzz.comms.test.{$suffix}@example.test",
        'primary_phone' => null, 'client_type' => 'individual',
        'preferred_contact_method' => 'email', 'language_preference' => 'en',
    ];
    $clientUser = ['user_id' => $clientUserId];

    // =========================================================
    // Admin sends -> client sees conversation with correct sender/message/timestamp
    // =========================================================
    $startResult = $adminService->startThread($adminUser, [
        'client_id' => $clientId, 'subject' => 'ZZZ Verify: initial admin message',
        'message' => 'ZZZ Verify: hello from Alchemize admin.',
    ]);
    $threadId = $startResult['thread_id'];
    $clientView = $clientService->thread($clientAccess, $threadId, true);
    verifyWorkflow($clientView['thread']['subject'] === 'ZZZ Verify: initial admin message', 'Client did not see the correct subject for an admin-started thread');
    verifyWorkflow(count($clientView['messages']) === 1, 'Client did not see exactly 1 message after admin start');
    verifyWorkflow($clientView['messages'][0]['sender_type'] === 'staff', 'Client did not see sender_type=staff for the admin message');
    verifyWorkflow($clientView['messages'][0]['message_body'] === 'ZZZ Verify: hello from Alchemize admin.', 'Client did not see the correct message body');
    verifyWorkflow(!empty($clientView['messages'][0]['created_at']), 'Client message is missing a created_at timestamp');
    echo "PASS Admin -> Client message: real thread/message row created and read back correctly\n";

    // =========================================================
    // Client replies -> Admin sees reply; unread/needs-response updates
    // =========================================================
    $replyResult = $clientService->sendMessage($clientAccess, $clientUser, $threadId, ['message' => 'ZZZ Verify: client reply #1.']);
    verifyWorkflow(!empty($replyResult['message_id']), 'Client reply did not produce a message id');

    // Check admin's list BEFORE calling AlchemizePortalAdminService::thread(),
    // which passes markRead=true internally and would mark the reply read.
    $adminThreadsList = $adminService->threads();
    $listedThread = null;
    foreach ($adminThreadsList['items'] as $row) if ($row['id'] === $threadId) { $listedThread = $row; break; }
    verifyWorkflow($listedThread !== null, 'Thread did not appear in the admin threads() list');
    verifyWorkflow($listedThread['status'] === 'waiting_on_alchemize', 'Admin list did not show waiting_on_alchemize after the client replied');
    verifyWorkflow((int) $listedThread['unread_count'] >= 1, 'Admin list did not show the client reply as unread');

    $adminThreadAfterReply = $adminService->thread($threadId);
    verifyWorkflow($adminThreadAfterReply['thread']['status'] === 'waiting_on_alchemize', 'Status did not auto-transition to waiting_on_alchemize after the client reply');
    $lastMessage = end($adminThreadAfterReply['messages']);
    verifyWorkflow($lastMessage['message_body'] === 'ZZZ Verify: client reply #1.', 'Admin did not see the client reply body');
    verifyWorkflow($lastMessage['sender_type'] === 'client', 'Admin did not see sender_type=client for the reply');
    echo "PASS Client -> Admin reply: real DB status auto-transition, unread count, and message body verified\n";

    // =========================================================
    // Admin sets Waiting on Client / ownership transitions
    // =========================================================
    $setWaitingOnClient = $adminService->updateThread($threadId, $adminUser, ['status' => 'waiting_on_client']);
    verifyWorkflow($setWaitingOnClient['status'] === 'waiting_on_client', 'updateThread did not return waiting_on_client');
    $adminThreadC = $adminService->thread($threadId);
    verifyWorkflow($adminThreadC['thread']['status'] === 'waiting_on_client', 'DB did not persist status=waiting_on_client');
    verifyWorkflow((int) $adminThreadC['thread']['client_action_required'] === 1, 'client_action_required was not set when marking waiting_on_client');
    $clientViewC = $clientService->thread($clientAccess, $threadId);
    verifyWorkflow($clientViewC['thread']['status'] === 'waiting_on_client', 'Client did not see waiting_on_client after the admin set it');
    echo "PASS Admin ownership transition (Waiting on Client) verified in both portals\n";

    // Client replies again -> verify the system moves back to Needs Alchemize Response.
    $clientService->sendMessage($clientAccess, $clientUser, $threadId, ['message' => 'ZZZ Verify: client reply #2.']);
    $adminThreadD = $adminService->thread($threadId);
    verifyWorkflow($adminThreadD['thread']['status'] === 'waiting_on_alchemize', 'A second client reply did not move the thread back to waiting_on_alchemize');
    verifyWorkflow((int) $adminThreadD['thread']['client_action_required'] === 0, 'client_action_required was not cleared after the client replied again');
    echo "PASS Client reply after Waiting on Client correctly returns ownership to Alchemize\n";

    // =========================================================
    // Admin resolves
    // =========================================================
    $resolveResult = $adminService->updateThread($threadId, $adminUser, ['status' => 'resolved']);
    verifyWorkflow($resolveResult['status'] === 'resolved', 'updateThread did not return resolved');
    verifyWorkflow($adminService->thread($threadId)['thread']['status'] === 'resolved', 'DB did not persist status=resolved');
    verifyWorkflow($clientService->thread($clientAccess, $threadId)['thread']['status'] === 'resolved', 'Client did not see resolved status');
    echo "PASS Admin resolve verified in both portals\n";

    // =========================================================
    // Admin archives -> Archived list/count updates, restore works
    // =========================================================
    $countsBefore = $adminService->threads();
    $openBefore = count(array_filter($countsBefore['items'], fn($t) => $t['status'] !== 'archived'));
    $archivedBefore = count(array_filter($countsBefore['items'], fn($t) => $t['status'] === 'archived'));

    $archiveResult = $adminService->updateThread($threadId, $adminUser, ['status' => 'archived']);
    verifyWorkflow($archiveResult['status'] === 'archived', 'updateThread did not return archived');
    verifyWorkflow($adminService->thread($threadId)['thread']['status'] === 'archived', 'DB did not persist status=archived');

    $countsAfterArchive = $adminService->threads();
    $openAfter = count(array_filter($countsAfterArchive['items'], fn($t) => $t['status'] !== 'archived'));
    $archivedAfter = count(array_filter($countsAfterArchive['items'], fn($t) => $t['status'] === 'archived'));
    verifyWorkflow($openAfter === $openBefore - 1, 'Open/Inbox count did not decrease by 1 after archiving');
    verifyWorkflow($archivedAfter === $archivedBefore + 1, 'Archived count did not increase by 1 after archiving');

    try {
        $clientService->sendMessage($clientAccess, $clientUser, $threadId, ['message' => 'ZZZ Verify: should be rejected.']);
        verifyWorkflow(false, 'An archived thread accepted a new client message instead of rejecting it');
    } catch (AlchemizeRequestException $error) {
        verifyWorkflow($error->errorCode === 'THREAD_ARCHIVED', 'Archived thread rejected the message with an unexpected error code: ' . $error->errorCode);
    }

    $restoreResult = $adminService->updateThread($threadId, $adminUser, ['status' => 'open']);
    verifyWorkflow($restoreResult['status'] === 'open', 'Restoring an archived thread did not return status=open');
    verifyWorkflow($adminService->thread($threadId)['thread']['status'] === 'open', 'DB did not persist status=open after restore');

    $countsAfterRestore = $adminService->threads();
    $openRestored = count(array_filter($countsAfterRestore['items'], fn($t) => $t['status'] !== 'archived'));
    $archivedRestored = count(array_filter($countsAfterRestore['items'], fn($t) => $t['status'] === 'archived'));
    verifyWorkflow($openRestored === $openBefore, 'Open/Inbox count did not return to its pre-archive value after restore');
    verifyWorkflow($archivedRestored === $archivedBefore, 'Archived count did not return to its pre-archive value after restore');

    $postRestoreReply = $clientService->sendMessage($clientAccess, $clientUser, $threadId, ['message' => 'ZZZ Verify: reply after restore.']);
    verifyWorkflow(!empty($postRestoreReply['message_id']), 'Client could not reply again after the thread was restored to the inbox');
    echo "PASS Admin archive/restore: counts, read-only enforcement, and post-restore reply all verified against the real database\n";

    // =========================================================
    // Related-record linking: only backend-supported, client-scoped records
    // =========================================================
    $linkResult = $adminService->linkThread($threadId, ['related_entity_type' => 'engagement', 'related_entity_id' => $engagementPublicId]);
    verifyWorkflow($linkResult['related_entity_type'] === 'engagement', 'linkThread did not return the linked engagement type');
    $adminThreadLinked = $adminService->thread($threadId);
    verifyWorkflow($adminThreadLinked['thread']['related_entity_type'] === 'engagement', 'DB did not persist related_entity_type=engagement');
    verifyWorkflow($adminThreadLinked['thread']['related_entity_id'] === $engagementPublicId, 'DB did not persist the linked engagement public id');
    $typedColumn = (int) $db->query("SELECT engagement_id FROM message_threads WHERE public_id = " . $db->quote($threadId))->fetchColumn();
    verifyWorkflow($typedColumn === $engagementId, 'linkThread did not also set the typed engagement_id FK column');

    try {
        $adminRepo->linkThread($threadId, 'engagement', $otherEngagementPublicId);
        verifyWorkflow(false, 'linkThread accepted a related record belonging to a different client');
    } catch (AlchemizeRequestException $error) {
        verifyWorkflow($error->httpStatus === 404, 'Cross-client linkThread rejection returned an unexpected status: ' . $error->httpStatus);
    }
    echo "PASS Related-record linking: real client-scoped engagement linked (typed FK + generic pair), cross-client record rejected\n";

    // =========================================================
    // Client-facing payload excludes internal/admin-only fields
    // =========================================================
    $finalClientView = $clientService->thread($clientAccess, $threadId);
    verifyWorkflow(!array_key_exists('created_by_user_id', $finalClientView['thread']), 'Client-facing thread payload leaked the internal created_by_user_id field');
    echo "PASS Client-facing payload omits internal/admin-only fields\n";
} finally {
    $cleanup();
}

$remainingThread = $threadId !== null
    ? (int) $db->query("SELECT COUNT(*) FROM message_threads WHERE public_id = " . $db->quote($threadId))->fetchColumn()
    : 0;
$remainingClients = (int) $db->query("SELECT COUNT(*) FROM clients WHERE id IN ({$clientId}, {$otherClientId})")->fetchColumn();
verifyWorkflow($remainingThread === 0 && $remainingClients === 0, 'Disposable test fixtures were not fully cleaned up');
echo "Communications workflow: Admin<->Client messaging, ownership transitions, resolve/archive/restore, and related-record linking, all verified against the real database.\n";
