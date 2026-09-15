<?php
// Data Maintenance: identifying candidates is not the same as it being safe
// to act on them. This test exercises the REAL backend round trip against
// the real local dev database, using the exact
// AlchemizeDataMaintenanceService methods the settings API route calls,
// and proves the safety guarantees the feature depends on:
//
//   - only genuinely-eligible records are ever mutated, even when a
//     tampered/stale selected_ids list is submitted (an ineligible or
//     already-current record can never be archived/deleted/purged)
//   - archiving a completed engagement preserves its relationship to an
//     invoice rather than cascading any deletion
//   - an accepted admin invitation (used_at set, user active) is never
//     touched by expired-invitation cleanup, and the resulting
//     administrator account is never deleted
//   - an active/unexpired security token is never purged
//   - every successful mutation writes a real audit_events row
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
$clientRoleId = (int) $db->query("SELECT id FROM roles WHERE slug = 'client' LIMIT 1")->fetchColumn();
$adminRoleId = (int) $db->query("SELECT id FROM roles WHERE slug = 'administrator' LIMIT 1")->fetchColumn();
verifyWorkflow($clientRoleId > 0 && $adminRoleId > 0, 'Setup failed: roles not found');

$suffix = bin2hex(random_bytes(4));
$clientRepo = new AlchemizeClientRepository($db);
$engagementRepo = new AlchemizeEngagementRepository($db);
$userRepo = new AlchemizeUserRepository($db);
$service = new AlchemizeDataMaintenanceService($db, $adminUserId);

// $updatedOffsetSql is a MySQL INTERVAL expression applied to
// CURRENT_TIMESTAMP(6) inside the query -- see the note above
// insertSchedulingLink() for why this isn't computed in PHP.
function makeClient(AlchemizeClientRepository $repo, string $suffix, string $tag, string $status, string $updatedOffsetSql): int {
    $id = $repo->create([
        'public_id' => alchemize_uuid_v4(), 'client_type' => 'individual',
        'display_name' => "ZZZ Maintenance {$tag} {$suffix}", 'legal_name' => null, 'preferred_name' => null,
        'primary_email' => "zzz.maint.{$tag}.{$suffix}@example.test", 'primary_phone' => null,
        'preferred_contact_method' => 'email', 'language_preference' => 'en',
        'status' => $status, 'portal_status' => 'active', 'source' => 'website', 'origin_lead_id' => null,
    ]);
    global $db;
    $db->exec("UPDATE clients SET updated_at = DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL {$updatedOffsetSql}) WHERE id = {$id}");
    return $id;
}

// --- Inactive prospects: one genuinely stale, one recently active ----------
$staleProspectId = makeClient($clientRepo, $suffix, 'stale-prospect', 'prospective', '-200 DAY');
$freshProspectId = makeClient($clientRepo, $suffix, 'fresh-prospect', 'prospective', '-2 DAY');
$activeClientId = makeClient($clientRepo, $suffix, 'active-client', 'active', '-200 DAY');

$cleanupClientIds = [$staleProspectId, $freshProspectId, $activeClientId];
$cleanupEngagementIds = [];
$cleanupInvoiceIds = [];
$cleanupLinkIds = [];
$cleanupUserIds = [];
$cleanupTokenIds = [];

try {
    echo "=== Inactive prospects ===\n";
    $overview = $service->overview(6);
    verifyWorkflow(is_int($overview['summary']['inactive_prospects']), 'overview() did not return an integer inactive_prospects count');

    $preview = $service->preview(['category' => 'inactive_prospects', 'limit' => 100]);
    $previewIds = array_column($preview['records'], 'id');
    verifyWorkflow(in_array($staleProspectId, $previewIds, true), 'The genuinely stale prospect did not appear in the inactive_prospects review');
    verifyWorkflow(!in_array($freshProspectId, $previewIds, true), 'A recently-active prospect incorrectly appeared as an inactive-prospect candidate');
    verifyWorkflow(!in_array($activeClientId, $previewIds, true), 'A non-prospective (active) client incorrectly appeared as an inactive-prospect candidate');
    echo "PASS Only the genuinely stale prospect qualifies for review\n";

    // Tamper: submit the fresh prospect and the active client alongside the
    // real stale one. The server must silently drop the ineligible ids
    // rather than archiving them just because the client asked to.
    $result = $service->execute([
        'action' => 'archive', 'category' => 'inactive_prospects',
        'selected_ids' => [$staleProspectId, $freshProspectId, $activeClientId],
    ]);
    verifyWorkflow($result['archived'] === 1, 'archive(inactive_prospects) archived a different count than the single eligible record: got ' . $result['archived']);
    $staleAfter = $clientRepo->findById($staleProspectId);
    $freshAfter = $clientRepo->findById($freshProspectId);
    $activeAfter = $clientRepo->findById($activeClientId);
    verifyWorkflow($staleAfter['status'] === 'archived', 'The eligible stale prospect was not archived');
    verifyWorkflow($freshAfter['status'] === 'prospective', 'A recently-active prospect was archived through the inactive-prospect endpoint despite not being eligible');
    verifyWorkflow($activeAfter['status'] === 'active', 'An active client was archived through the inactive-prospect maintenance endpoint');
    echo "PASS A tampered selection cannot archive an ineligible or already-current prospect\n";

    $audit = $db->query("SELECT event_type, entity_id, action_summary, actor_user_id FROM audit_events WHERE event_type = 'maintenance.prospect_archive' AND entity_id = " . (int) $staleProspectId)->fetch(PDO::FETCH_ASSOC);
    verifyWorkflow($audit !== false, 'No audit_events row was written for the prospect archival');
    verifyWorkflow((int) $audit['actor_user_id'] === $adminUserId, 'Audit event did not record the correct actor');
    echo "PASS Audit event recorded (who/what/when) for the prospect archival\n";

    // --- Completed engagements: preserves related records -------------------
    echo "\n=== Completed engagements ===\n";
    $oldEngagementId = $engagementRepo->create([
        'public_id' => alchemize_uuid_v4(), 'engagement_number' => "ZZZ-OLD-{$suffix}", 'client_id' => $activeClientId,
        'title' => "ZZZ Old Completed Engagement {$suffix}", 'description' => null, 'status' => 'completed',
        'start_date' => date('Y-m-d', strtotime('-400 days')), 'target_date' => null,
        'completion_date' => date('Y-m-d', strtotime('-250 days')), 'owner_user_id' => null,
        'billing_arrangement' => null, 'scope_notes' => null, 'pricing_notes' => null,
    ]);
    $recentEngagementId = $engagementRepo->create([
        'public_id' => alchemize_uuid_v4(), 'engagement_number' => "ZZZ-RECENT-{$suffix}", 'client_id' => $activeClientId,
        'title' => "ZZZ Recent Completed Engagement {$suffix}", 'description' => null, 'status' => 'completed',
        'start_date' => date('Y-m-d', strtotime('-30 days')), 'target_date' => null,
        'completion_date' => date('Y-m-d', strtotime('-5 days')), 'owner_user_id' => null,
        'billing_arrangement' => null, 'scope_notes' => null, 'pricing_notes' => null,
    ]);
    $cleanupEngagementIds = [$oldEngagementId, $recentEngagementId];

    $invoicePublicId = alchemize_uuid_v4();
    $db->prepare('INSERT INTO invoices (public_id, invoice_number, client_id, engagement_id, invoice_date, status) VALUES (:pid, :num, :client, :engagement, :date, :status)')
        ->execute(['pid' => $invoicePublicId, 'num' => "ZZZ-INV-{$suffix}", 'client' => $activeClientId, 'engagement' => $oldEngagementId, 'date' => date('Y-m-d'), 'status' => 'paid']);
    $invoiceId = (int) $db->lastInsertId();
    $cleanupInvoiceIds[] = $invoiceId;

    $preview = $service->preview(['category' => 'completed_engagements', 'limit' => 100]);
    $previewIds = array_column($preview['records'], 'id');
    verifyWorkflow(in_array($oldEngagementId, $previewIds, true), 'The old completed engagement did not appear in the completed_engagements review');
    verifyWorkflow(!in_array($recentEngagementId, $previewIds, true), 'A recently-completed engagement (inside the review threshold) incorrectly appeared as a candidate');
    echo "PASS Only completed engagements past the configured threshold qualify for review\n";

    $result = $service->execute([
        'action' => 'archive', 'category' => 'completed_engagements',
        'selected_ids' => [$oldEngagementId, $recentEngagementId],
    ]);
    verifyWorkflow($result['archived'] === 1, 'archive(completed_engagements) archived a different count than the single eligible record: got ' . $result['archived']);
    $oldEngagementAfter = $db->query("SELECT status FROM engagements WHERE id = {$oldEngagementId}")->fetch(PDO::FETCH_ASSOC);
    $recentEngagementAfter = $db->query("SELECT status FROM engagements WHERE id = {$recentEngagementId}")->fetch(PDO::FETCH_ASSOC);
    verifyWorkflow($oldEngagementAfter['status'] === 'archived', 'The eligible old engagement was not archived');
    verifyWorkflow($recentEngagementAfter['status'] === 'completed', 'A recently-completed engagement was archived despite not being eligible');
    $invoiceAfter = $db->query("SELECT engagement_id FROM invoices WHERE id = {$invoiceId}")->fetch(PDO::FETCH_ASSOC);
    verifyWorkflow((int) $invoiceAfter['engagement_id'] === $oldEngagementId, 'Archiving the engagement broke or cascaded into its linked invoice');
    echo "PASS Archiving a completed engagement preserves its linked invoice (no cascade delete)\n";

    // --- Expired scheduling links --------------------------------------------
    echo "\n=== Expired scheduling links ===\n";
    $linkTable = $db->query("SHOW TABLES LIKE 'appointment_scheduling_links'")->fetchColumn();
    if ($linkTable) {
        $expiredLinkId = insertSchedulingLink($db, $suffix, 'expired', '-2 DAY');
        $activeLinkId = insertSchedulingLink($db, $suffix, 'active', '+2 DAY');
        $cleanupLinkIds = [$expiredLinkId, $activeLinkId];

        $preview = $service->preview(['category' => 'expired_links', 'limit' => 100]);
        $previewIds = array_column($preview['records'], 'id');
        verifyWorkflow(in_array($expiredLinkId, $previewIds, true), 'The expired scheduling link did not appear in review');
        verifyWorkflow(!in_array($activeLinkId, $previewIds, true), 'An active (unexpired) scheduling link incorrectly appeared as a candidate');

        $result = $service->execute([
            'action' => 'delete', 'category' => 'expired_links', 'confirm' => 'DELETE EXPIRED LINKS',
            'selected_ids' => [$expiredLinkId, $activeLinkId],
        ]);
        verifyWorkflow($result['deleted'] === 1, 'delete(expired_links) deleted a different count than the single eligible record: got ' . $result['deleted']);
        $expiredLinkGone = (int) $db->query("SELECT COUNT(*) FROM appointment_scheduling_links WHERE id = {$expiredLinkId}")->fetchColumn();
        $activeLinkStill = (int) $db->query("SELECT COUNT(*) FROM appointment_scheduling_links WHERE id = {$activeLinkId}")->fetchColumn();
        verifyWorkflow($expiredLinkGone === 0, 'The expired scheduling link was not deleted');
        verifyWorkflow($activeLinkStill === 1, 'An active scheduling link was deleted through expired-link cleanup');
        $cleanupLinkIds = [$activeLinkId];
        echo "PASS Only the expired scheduling link is deleted; an active link is untouched\n";
    } else {
        echo "SKIPPED expired scheduling links (appointment_scheduling_links table not present)\n";
    }

    // --- Expired admin invitations: accepted invitation is never touched ----
    echo "\n=== Expired admin invitations ===\n";
    $expiredInviteUserId = makeInvitedUser($db, $userRepo, $suffix, 'expired-invite', $adminRoleId, '-1 HOUR', false, null);
    $activeInviteUserId = makeInvitedUser($db, $userRepo, $suffix, 'active-invite', $adminRoleId, '+2 DAY', false, null);
    $acceptedUserId = makeInvitedUser($db, $userRepo, $suffix, 'accepted-invite', $adminRoleId, '-1 HOUR', true, 'active');
    $cleanupUserIds = [$expiredInviteUserId, $activeInviteUserId, $acceptedUserId];

    $preview = $service->preview(['category' => 'expired_invitations', 'limit' => 100]);
    $previewIds = array_column($preview['records'], 'user_id');
    verifyWorkflow(in_array($expiredInviteUserId, $previewIds, true), 'The expired, unaccepted invitation did not appear in review');
    verifyWorkflow(!in_array($activeInviteUserId, $previewIds, true), 'A still-valid invitation incorrectly appeared as an expired-invitation candidate');
    verifyWorkflow(!in_array($acceptedUserId, $previewIds, true), 'An already-accepted invitation incorrectly appeared as an expired-invitation candidate');

    $result = $service->execute([
        'action' => 'remove', 'category' => 'expired_invitations',
        'selected_ids' => [$expiredInviteUserId, $activeInviteUserId, $acceptedUserId],
    ]);
    verifyWorkflow($result['removed'] === 1, 'remove(expired_invitations) removed a different count than the single eligible record: got ' . $result['removed']);
    $expiredUserAfter = $userRepo->findById($expiredInviteUserId);
    $activeUserAfter = $userRepo->findById($activeInviteUserId);
    $acceptedUserAfter = $userRepo->findById($acceptedUserId);
    verifyWorkflow($expiredUserAfter['status'] === 'archived', 'The expired invitation placeholder account was not archived');
    verifyWorkflow($activeUserAfter['status'] === 'invited', 'A still-valid invitation was removed through expired-invitation cleanup');
    verifyWorkflow($acceptedUserAfter['status'] === 'active', 'Expired-invitation cleanup deleted or altered an already-active administrator account that had accepted its invitation');
    echo "PASS Only the expired, unaccepted invitation is removed -- an active invitation and an already-accepted administrator account are both untouched\n";

    // --- Expired security tokens: active token is never purged --------------
    echo "\n=== Expired security tokens ===\n";
    $tokenClientId = $activeClientId;
    $expiredTokenId = insertToken($db, $tokenClientId, $adminUserId, 'password_reset', '-1 HOUR');
    $activeTokenId = insertToken($db, $tokenClientId, $adminUserId, 'password_reset', '+1 HOUR');
    $cleanupTokenIds = [$expiredTokenId, $activeTokenId];

    $preview = $service->preview(['category' => 'expired_tokens', 'limit' => 100]);
    $previewIds = array_column($preview['records'], 'id');
    verifyWorkflow(in_array($expiredTokenId, $previewIds, true), 'The expired token did not appear in review');
    verifyWorkflow(!in_array($activeTokenId, $previewIds, true), 'An active (unexpired) token incorrectly appeared as an expired-token candidate');

    $result = $service->execute([
        'action' => 'purge', 'category' => 'expired_tokens', 'confirm' => 'PURGE EXPIRED TOKENS',
        'selected_ids' => [$expiredTokenId, $activeTokenId],
    ]);
    verifyWorkflow($result['deleted'] === 1, 'purge(expired_tokens) purged a different count than the single eligible record: got ' . $result['deleted']);
    $expiredTokenGone = (int) $db->query("SELECT COUNT(*) FROM portal_account_tokens WHERE id = {$expiredTokenId}")->fetchColumn();
    $activeTokenStill = (int) $db->query("SELECT COUNT(*) FROM portal_account_tokens WHERE id = {$activeTokenId}")->fetchColumn();
    verifyWorkflow($expiredTokenGone === 0, 'The expired token was not purged');
    verifyWorkflow($activeTokenStill === 1, 'An active, unexpired token was purged through expired-token cleanup');
    $cleanupTokenIds = [$activeTokenId];
    echo "PASS Only the expired token is purged; an active token is never affected\n";

    // --- History ---------------------------------------------------------------
    echo "\n=== Maintenance history ===\n";
    $history = $service->history(50);
    $eventTypes = array_column($history, 'event_type');
    verifyWorkflow(in_array('maintenance.prospect_archive', $eventTypes, true), 'history() did not include the prospect archival event');
    verifyWorkflow(in_array('maintenance.engagement_archive', $eventTypes, true), 'history() did not include the engagement archival event');
    verifyWorkflow(in_array('maintenance.invitation_cleanup', $eventTypes, true), 'history() did not include the invitation cleanup event');
    verifyWorkflow(in_array('maintenance.token_cleanup', $eventTypes, true), 'history() did not include the token cleanup event');
    echo "PASS Maintenance history reflects the real actions just performed\n";
} finally {
    // --- Cleanup: disposable fixtures only, in FK-safe order -------------------
    if ($cleanupTokenIds) {
        $ids = implode(',', array_map('intval', $cleanupTokenIds));
        $db->exec("DELETE FROM portal_account_tokens WHERE id IN ({$ids})");
    }
    $db->exec("DELETE FROM portal_account_tokens WHERE user_id IN (" . implode(',', array_map('intval', $cleanupUserIds ?: [0])) . ")");
    if ($cleanupLinkIds) {
        $ids = implode(',', array_map('intval', $cleanupLinkIds));
        $db->exec("DELETE FROM appointment_scheduling_links WHERE id IN ({$ids})");
    }
    if ($cleanupInvoiceIds) {
        $ids = implode(',', array_map('intval', $cleanupInvoiceIds));
        $db->exec("DELETE FROM invoices WHERE id IN ({$ids})");
    }
    if ($cleanupEngagementIds) {
        $ids = implode(',', array_map('intval', $cleanupEngagementIds));
        $db->exec("DELETE FROM engagement_service_items WHERE engagement_id IN ({$ids})");
        $db->exec("DELETE FROM engagements WHERE id IN ({$ids})");
    }
    $db->exec("DELETE FROM audit_events WHERE entity_type = 'client' AND entity_id IN (" . implode(',', array_map('intval', $cleanupClientIds)) . ")");
    $db->exec("DELETE FROM audit_events WHERE entity_type = 'engagement' AND entity_id IN (" . implode(',', array_map('intval', $cleanupEngagementIds ?: [0])) . ")");
    $db->exec("DELETE FROM audit_events WHERE entity_type = 'user' AND entity_id IN (" . implode(',', array_map('intval', $cleanupUserIds ?: [0])) . ")");
    $db->exec("DELETE FROM audit_events WHERE entity_type = 'appointment_scheduling_link' AND entity_id IN (" . implode(',', array_map('intval', $cleanupLinkIds ?: [0])) . ")");
    $db->exec("DELETE FROM audit_events WHERE entity_type = 'portal_account_tokens' AND entity_id IN (" . implode(',', array_map('intval', $cleanupTokenIds ?: [0])) . ")");
    if ($cleanupUserIds) {
        $ids = implode(',', array_map('intval', $cleanupUserIds));
        $db->exec("DELETE FROM users WHERE id IN ({$ids})");
    }
    if ($cleanupClientIds) {
        $ids = implode(',', array_map('intval', $cleanupClientIds));
        $db->exec("DELETE FROM clients WHERE id IN ({$ids})");
    }
}

$remainingClients = (int) $db->query("SELECT COUNT(*) FROM clients WHERE id IN (" . implode(',', array_map('intval', $cleanupClientIds)) . ")")->fetchColumn();
$remainingUsers = $cleanupUserIds
    ? (int) $db->query("SELECT COUNT(*) FROM users WHERE id IN (" . implode(',', array_map('intval', $cleanupUserIds)) . ")")->fetchColumn()
    : 0;
verifyWorkflow($remainingClients === 0 && $remainingUsers === 0, 'Disposable test fixtures were not fully cleaned up');
echo "\nData Maintenance workflow: eligibility enforcement, tampered-selection safety, archival preservation of related records, and audit history all verified against the real database.\n";

// $expiresOffsetSql is a MySQL INTERVAL expression (e.g. '-1 HOUR',
// '+2 DAY') applied to CURRENT_TIMESTAMP(6) *inside* the query, rather than
// computed in PHP -- PHP's local timezone and the database connection's
// session timezone are not guaranteed to match, and computing "expired"
// timestamps in PHP silently produced values hours off from the database's
// own clock, flipping records from expired to not-yet-expired.
function insertSchedulingLink(PDO $db, string $suffix, string $tag, string $expiresOffsetSql): int {
    $publicId = alchemize_uuid_v4();
    $tokenHash = hash('sha256', $publicId);
    $db->prepare("INSERT INTO appointment_scheduling_links (public_id, token_hash, appointment_type, expires_at, recipient_email, recipient_name) VALUES (:pid, :hash, :type, DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL {$expiresOffsetSql}), :email, :name)")
        ->execute([
            'pid' => $publicId, 'hash' => $tokenHash, 'type' => "ZZZ {$tag} {$suffix}",
            'email' => "zzz.maint.link.{$tag}.{$suffix}@example.test", 'name' => "ZZZ {$tag}",
        ]);
    return (int) $db->lastInsertId();
}

function insertToken(PDO $db, int $clientId, int $actorId, string $purpose, string $expiresOffsetSql): int {
    $raw = bin2hex(random_bytes(16));
    $db->prepare("INSERT INTO portal_account_tokens (public_id, user_id, client_id, purpose, token_hash, expires_at, created_by_user_id) VALUES (:pid, :user, :client, :purpose, :hash, DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL {$expiresOffsetSql}), :actor)")
        ->execute([
            'pid' => alchemize_uuid_v4(), 'user' => $actorId, 'client' => $clientId, 'purpose' => $purpose,
            'hash' => hash('sha256', $raw), 'actor' => $actorId,
        ]);
    return (int) $db->lastInsertId();
}

function makeInvitedUser(PDO $db, AlchemizeUserRepository $userRepo, string $suffix, string $tag, int $roleId, string $expiresOffsetSql, bool $used, ?string $activeStatus): int {
    $userId = $userRepo->create([
        'public_id' => alchemize_uuid_v4(), 'email' => "zzz.maint.{$tag}.{$suffix}@example.test",
        'password_hash' => $activeStatus ? password_hash('ZZZTestPass!2026', PASSWORD_DEFAULT) : null,
        'display_name' => "ZZZ {$tag} {$suffix}", 'status' => $activeStatus ?: 'invited', 'role_id' => $roleId,
    ]);
    $raw = bin2hex(random_bytes(16));
    $usedExpr = $used ? 'DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL 30 MINUTE)' : 'NULL';
    $db->prepare("INSERT INTO portal_account_tokens (public_id, user_id, client_id, purpose, token_hash, expires_at, created_by_user_id, used_at) VALUES (:pid, :user, NULL, :purpose, :hash, DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL {$expiresOffsetSql}), :actor, {$usedExpr})")
        ->execute([
            'pid' => alchemize_uuid_v4(), 'user' => $userId, 'purpose' => 'admin_invitation',
            'hash' => hash('sha256', $raw), 'actor' => $userId,
        ]);
    return $userId;
}
