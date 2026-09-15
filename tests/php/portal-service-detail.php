<?php
// Client Portal Services -> View Service, run against the REAL local dev
// database with disposable fixtures.
//
// Production failure reproduced from private/logs/portal-errors.log:
//   route: portal/services/<engagement public_id>
//   PDOException: SQLSTATE[HY093]: Invalid parameter number
//   file: repositories/portal-repository.php, line 111 (listTasksForEngagement)
//
// Root cause: listTasksForEngagement()/listDocumentsForEngagement()/
// listAppointmentsForEngagement() each reused the SAME named PDO
// placeholder (e.g. :task_client_id) twice in one query. This app runs
// with native (non-emulated) PDO prepares, and MySQL's protocol rejects
// binding one named parameter to two placeholder occurrences. This test
// proves the fixed queries actually run, that a fully-populated service
// detail loads end-to-end, that missing optional related data (zero
// tasks/documents/appointments) never crashes it, and that client
// ownership isolation is enforced by the query itself.
declare(strict_types=1);

function verifyDetail(bool $condition, string $message): void {
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
require_once __DIR__.'/../../server/repositories/portal-repository.php';
require_once __DIR__.'/../../server/services/portal-service.php';
require_once __DIR__.'/../../server/services/lead-service.php';

$config = alchemize_config();
try {
    $db = alchemize_database($config['database']);
} catch (Throwable $error) {
    echo "SKIPPED: no local dev database reachable (" . $error->getMessage() . ").\n";
    exit(0);
}

$suffix = bin2hex(random_bytes(4));
$repository = new AlchemizePortalRepository($db);
$service = new AlchemizePortalService($repository);

$cleanupClientIds = [];
$cleanupEngagementIds = [];
$cleanupTaskIds = [];
$cleanupDocumentIds = [];
$cleanupAppointmentIds = [];

function makeClient(PDO $db, string $suffix, string $tag): int {
    $db->prepare('INSERT INTO clients (public_id, client_type, display_name, primary_email, preferred_contact_method, language_preference, status, portal_status, source) VALUES (:pid, :type, :name, :email, :contact, :lang, :status, :portal, :source)')
        ->execute([
            'pid' => alchemize_uuid_v4(), 'type' => 'individual', 'name' => "ZZZ Portal Detail {$tag} {$suffix}",
            'email' => "zzz.portal.detail.{$tag}.{$suffix}@example.test", 'contact' => 'email', 'lang' => 'en',
            'status' => 'active', 'portal' => 'active', 'source' => 'website',
        ]);
    return (int) $db->lastInsertId();
}

function makeEngagement(PDO $db, string $suffix, string $tag, int $clientId): array {
    $publicId = alchemize_uuid_v4();
    $db->prepare('INSERT INTO engagements (public_id, engagement_number, client_id, title, status, start_date) VALUES (:pid, :num, :client, :title, :status, :start)')
        ->execute([
            'pid' => $publicId, 'num' => "ZZZ-PD-{$tag}-{$suffix}", 'client' => $clientId,
            'title' => "ZZZ Portal Detail Engagement {$tag} {$suffix}", 'status' => 'preparing', 'start' => date('Y-m-d'),
        ]);
    return [(int) $db->lastInsertId(), $publicId];
}

try {
    echo "=== Fully populated service detail loads without a PDOException ===\n";
    $clientId = makeClient($db, $suffix, 'owner');
    $cleanupClientIds[] = $clientId;
    [$engagementId, $engagementPublicId] = makeEngagement($db, $suffix, 'populated', $clientId);
    $cleanupEngagementIds[] = $engagementId;

    $db->prepare("INSERT INTO tasks (public_id, client_id, engagement_id, title, status, visibility) VALUES (:pid, :client, :engagement, :title, 'not_started', 'client')")
        ->execute(['pid' => alchemize_uuid_v4(), 'client' => $clientId, 'engagement' => $engagementId, 'title' => "ZZZ Task {$suffix}"]);
    $cleanupTaskIds[] = (int) $db->lastInsertId();

    $db->prepare("INSERT INTO documents_metadata (public_id, client_id, engagement_id, document_name, status, visibility) VALUES (:pid, :client, :engagement, :name, 'requested', 'client')")
        ->execute(['pid' => alchemize_uuid_v4(), 'client' => $clientId, 'engagement' => $engagementId, 'name' => "ZZZ Document {$suffix}"]);
    $cleanupDocumentIds[] = (int) $db->lastInsertId();

    $db->prepare("INSERT INTO appointments (public_id, client_id, engagement_id, appointment_type, scheduled_at, status, visibility) VALUES (:pid, :client, :engagement, :type, :scheduled, 'confirmed', 'client')")
        ->execute(['pid' => alchemize_uuid_v4(), 'client' => $clientId, 'engagement' => $engagementId, 'type' => "ZZZ Consultation {$suffix}", 'scheduled' => date('Y-m-d H:i:s', strtotime('+2 days'))]);
    $cleanupAppointmentIds[] = (int) $db->lastInsertId();

    $access = ['client_id' => $clientId];
    $detail = $service->serviceDetail($access, $engagementPublicId);
    verifyDetail($detail['item']['id'] === $engagementPublicId, 'The returned detail did not match the requested engagement');
    verifyDetail(count($detail['tasks']) === 1, 'The related task did not load (this is exactly the previously-thrown PDOException path)');
    verifyDetail(count($detail['documents']) === 1, 'The related document did not load (this is exactly the previously-thrown PDOException path)');
    verifyDetail(count($detail['appointments']) === 1, 'The related appointment did not load (this is exactly the previously-thrown PDOException path)');
    echo "PASS Service detail loads with its real task, document, and appointment -- no Invalid parameter number error\n";

    echo "\n=== Missing optional related data never crashes the page ===\n";
    [$emptyEngagementId, $emptyEngagementPublicId] = makeEngagement($db, $suffix, 'empty', $clientId);
    $cleanupEngagementIds[] = $emptyEngagementId;
    $emptyDetail = $service->serviceDetail($access, $emptyEngagementPublicId);
    verifyDetail($emptyDetail['tasks'] === [], 'Zero tasks should be a valid empty array, not a crash');
    verifyDetail($emptyDetail['documents'] === [], 'Zero documents should be a valid empty array, not a crash');
    verifyDetail($emptyDetail['appointments'] === [], 'Zero appointments should be a valid empty array, not a crash');
    echo "PASS A service with no related tasks, documents, or appointments loads with valid empty states\n";

    echo "\n=== Client ownership isolation ===\n";
    $otherClientId = makeClient($db, $suffix, 'other');
    $cleanupClientIds[] = $otherClientId;
    $otherAccess = ['client_id' => $otherClientId];
    $crossClientDetail = $repository->getServiceDetail($otherClientId, $engagementPublicId);
    verifyDetail($crossClientDetail === null, 'A different client was able to load another client\'s service detail');
    try {
        $service->serviceDetail($otherAccess, $engagementPublicId);
        verifyDetail(false, 'serviceDetail() did not reject a service belonging to a different client');
    } catch (AlchemizeRequestException $error) {
        verifyDetail($error->httpStatus === 404, 'A cross-client service request should surface as 404, not leak an internal error');
    }
    echo "PASS A client cannot load another client's service detail (safe 404, not the service data)\n";

    echo "\n=== Nonexistent service ===\n";
    try {
        $service->serviceDetail($access, alchemize_uuid_v4());
        verifyDetail(false, 'serviceDetail() did not reject a nonexistent engagement id');
    } catch (AlchemizeRequestException $error) {
        verifyDetail($error->httpStatus === 404, 'A nonexistent service id should surface as a safe 404');
    }
    echo "PASS A nonexistent service id returns a safe not-found response\n";

    echo "\n=== The list and detail identifiers agree ===\n";
    $listItems = $service->services($access);
    $listedIds = array_column($listItems['items'], 'id');
    verifyDetail(in_array($engagementPublicId, $listedIds, true), 'The Services list did not include the engagement using its public_id');
    echo "PASS The Services list's item.id is the same public_id View Service uses to load detail\n";
} finally {
    if ($cleanupTaskIds) $db->exec('DELETE FROM tasks WHERE id IN (' . implode(',', array_map('intval', $cleanupTaskIds)) . ')');
    if ($cleanupDocumentIds) $db->exec('DELETE FROM documents_metadata WHERE id IN (' . implode(',', array_map('intval', $cleanupDocumentIds)) . ')');
    if ($cleanupAppointmentIds) $db->exec('DELETE FROM appointments WHERE id IN (' . implode(',', array_map('intval', $cleanupAppointmentIds)) . ')');
    if ($cleanupEngagementIds) {
        $ids = implode(',', array_map('intval', $cleanupEngagementIds));
        $db->exec("DELETE FROM engagement_service_items WHERE engagement_id IN ({$ids})");
        $db->exec("DELETE FROM engagements WHERE id IN ({$ids})");
    }
    if ($cleanupClientIds) $db->exec('DELETE FROM clients WHERE id IN (' . implode(',', array_map('intval', $cleanupClientIds)) . ')');
}

echo "\nClient Portal service detail: the fixed related-data queries load real tasks/documents/appointments, empty related data never crashes the page, and client ownership isolation is enforced server-side.\n";
