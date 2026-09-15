<?php
// Local-only integration fixture: real PHP uploads, MySQL, repositories, storage and Google SDK.
declare(strict_types=1);
if (PHP_SAPI !== 'cli-server' || !getenv('ALCHEMIZE_DRIVE_TEST_ROOT')) { http_response_code(404); exit; }
require __DIR__ . '/../../vendor/autoload.php';
foreach (['http/request', 'validation/lead-validator', 'repositories/portal-action-repository', 'repositories/portal-admin-repository', 'repositories/external-integration-repository', 'repositories/activity-repository', 'repositories/audit-event-repository', 'repositories/notification-repository', 'services/google-client-factory', 'services/google-drive-service', 'services/document-storage-service', 'services/external-integration-service', 'services/notification-service', 'services/portal-action-service'] as $file) require_once __DIR__ . '/../../server/' . $file . '.php';
function alchemize_uuid_v4(): string { return bin2hex(random_bytes(16)); }
$root = getenv('ALCHEMIZE_DRIVE_TEST_ROOT');
$schema = getenv('ALCHEMIZE_DRIVE_TEST_SCHEMA');
if (!preg_match('/^alchemize_drive_test_[a-f0-9]{12}$/', $schema)) throw new RuntimeException('Unsafe test schema');
$db = new PDO('mysql:host=127.0.0.1;port=33317;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
$op = $_GET['op'] ?? '';
header('Content-Type: application/json');
if ($op === 'setup') {
    $db->exec('CREATE DATABASE ' . $schema); $db->exec('USE ' . $schema);
    $db->exec("CREATE TABLE clients (id BIGINT PRIMARY KEY, public_id VARCHAR(36), display_name VARCHAR(150), google_drive_folder_id VARCHAR(255), drive_sync_status VARCHAR(30), drive_sync_attempted_at TIMESTAMP(6) NULL, drive_synced_at TIMESTAMP(6) NULL, drive_sync_error TEXT)");
    $db->exec("INSERT INTO clients (id,public_id,display_name) VALUES (1,'client-one','Same Name'),(2,'client-two','Same Name')");
    $db->exec("CREATE TABLE engagements (id BIGINT PRIMARY KEY, public_id VARCHAR(36), client_id BIGINT, archived_at TIMESTAMP NULL)");
    $db->exec("INSERT INTO engagements VALUES (1,'engagement-one',1,NULL),(2,'engagement-two',2,NULL)");
    $db->exec("CREATE TABLE documents_metadata (id BIGINT PRIMARY KEY AUTO_INCREMENT, public_id VARCHAR(36), client_id BIGINT, engagement_id BIGINT, document_name VARCHAR(255), document_type VARCHAR(50), status VARCHAR(50), visibility VARCHAR(20), storage_key VARCHAR(255), mime_type VARCHAR(100), received_date DATE, client_instructions TEXT, archived_at TIMESTAMP NULL)");
    $db->exec("INSERT INTO documents_metadata (id,public_id,client_id,engagement_id,document_name,status,visibility) VALUES (1,'request-one',1,1,'Requested PDF','requested','client'),(2,'request-two',2,2,'Other PDF','requested','client'),(3,'internal-one',1,1,'Internal','requested','internal'),(4,'request-failure',1,1,'Failing PDF','requested','client'),(5,'request-db-failure',1,1,'DB failure PDF','requested','client')");
    $db->exec("CREATE TABLE document_submissions (id BIGINT AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(36), document_id BIGINT, client_id BIGINT, version_number INT, submitted_by_user_id BIGINT, original_filename VARCHAR(255), storage_key VARCHAR(255), mime_type VARCHAR(100), file_extension VARCHAR(10), file_size_bytes BIGINT, sha256 VARCHAR(64), client_comment TEXT, archived_at TIMESTAMP NULL, google_drive_file_id VARCHAR(255), drive_sync_status VARCHAR(30), drive_sync_attempted_at TIMESTAMP(6) NULL, drive_synced_at TIMESTAMP(6) NULL, drive_sync_error TEXT, UNIQUE(document_id, version_number))");
    $db->exec("CREATE TABLE activity_events (public_id VARCHAR(36), event_type VARCHAR(100), actor_type VARCHAR(20), actor_user_id BIGINT, entity_type VARCHAR(100), entity_id VARCHAR(36), lead_id BIGINT, client_id BIGINT, engagement_id BIGINT, summary TEXT, visibility VARCHAR(20))");
    $db->exec("CREATE TABLE audit_events (public_id VARCHAR(36), actor_user_id BIGINT, event_type VARCHAR(100), entity_type VARCHAR(100), entity_id VARCHAR(36), action_summary TEXT, request_metadata TEXT)");
    $db->exec("CREATE TABLE application_settings (setting_key VARCHAR(100), setting_value TEXT)");
    $db->exec("INSERT INTO application_settings VALUES ('staff_notification_delivery_mode','disabled')");
    file_put_contents($root . '/google.json', json_encode(['files' => [], 'calls' => []]));
    echo '{}'; exit;
}
$db->exec('USE ' . $schema);
if ($op === 'cleanup') { $db->exec('DROP DATABASE ' . $schema); echo '{}'; exit; }
$handler = function ($request) use ($root) {
    $state = json_decode(file_get_contents($root . '/google.json'), true);
    $uri = $request->getUri(); parse_str($uri->getQuery(), $query);
    $method = $request->getMethod(); $path = $uri->getPath();
    $state['calls'][] = [$method, $path]; $response = [];
    if ($method === 'GET' && str_ends_with($path, '/files')) {
        $response = ['files' => []];
        foreach ($state['files'] as $id => $file) {
            if (!empty($file['trashed'])) continue;
            $property = $file['appProperties'] ?? [];
            foreach ($property as $key => $value) {
                if (str_contains($query['q'], $key) && str_contains($query['q'], $value) && str_contains($query['q'], $file['parents'][0])) $response['files'][] = ['id' => $id];
            }
        }
    } elseif ($method === 'POST') {
        $body = (string) $request->getBody();
        if (isset($query['uploadType'])) {
            if (isset($_GET['fail'])) return GuzzleHttp\Promise\Create::promiseFor(new GuzzleHttp\Psr7\Response(503, [], '{"error":{"code":503,"message":"simulated storage failure"}}'));
            preg_match_all('/\r\n\r\n(.*?)\r\n--/s', $body, $parts);
            $metadata = json_decode($parts[1][0], true); $metadata['bytes'] = trim($parts[1][1]);
        } else $metadata = json_decode($body, true);
        $id = 'object_' . (count($state['files']) + 1); $state['files'][$id] = $metadata; $response = ['id' => $id];
    } elseif ($method === 'PATCH') {
        $id = basename($path); $state['files'][$id]['trashed'] = true; $response = ['id' => $id];
    } elseif ($method === 'GET') {
        $id = basename($path);
        if ($id === 'root') $response = ['id' => 'root', 'mimeType' => 'application/vnd.google-apps.folder', 'capabilities' => ['canAddChildren' => true]];
        elseif (!empty($state['files'][$id]['bytes'])) {
            file_put_contents($root . '/google.json', json_encode($state));
            return GuzzleHttp\Promise\Create::promiseFor(new GuzzleHttp\Psr7\Response(200, [], base64_decode($state['files'][$id]['bytes'])));
        } else return GuzzleHttp\Promise\Create::promiseFor(new GuzzleHttp\Psr7\Response(404));
    }
    file_put_contents($root . '/google.json', json_encode($state));
    return GuzzleHttp\Promise\Create::promiseFor(new GuzzleHttp\Psr7\Response(200, ['Content-Type' => 'application/json'], json_encode($response)));
};
$google = new Google\Client(); $google->setAccessToken(['access_token' => 'local-test-token', 'expires_in' => 3600, 'created' => time()]);
$google->setHttpClient(new GuzzleHttp\Client(['handler' => GuzzleHttp\HandlerStack::create($handler)]));
$drive = new AlchemizeGoogleDriveService(new AlchemizeGoogleClientFactory([]), ['client_root_folder_id' => 'root'], new Google\Service\Drive($google));
$storage = new AlchemizeDocumentStorageService($root . '/staging', $drive);
$repository = new AlchemizePortalActionRepository($db);
$service = new AlchemizePortalActionService($repository, new AlchemizeActivityRepository($db), new AlchemizeAuditEventRepository($db), $storage, new AlchemizeNotificationService(new AlchemizeNotificationRepository($db)), new AlchemizeExternalIntegrationService(new AlchemizeExternalIntegrationRepository($db), $drive, null, []));
// The fixture supplies an authenticated identity; application relationship checks remain real.
$access = ['client_id' => (int) ($_GET['client'] ?? 1), 'access_role' => 'primary_contact']; $user = ['user_id' => 7];
try {
    if ($op === 'upload') {
        if (isset($_GET['dbfail'])) $db->exec("CREATE TRIGGER reject_audit BEFORE INSERT ON audit_events FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='simulated database failure'");
        try { $result = $service->uploadDocument($access, $user, $_GET['document'], $_FILES['file'], 'test upload'); }
        finally { if (isset($_GET['dbfail'])) $db->exec('DROP TRIGGER reject_audit'); }
    } elseif ($op === 'general') $result = $service->uploadGeneralDocument($access, $user, $_FILES['file'], $_POST);
    elseif ($op === 'download') $service->sendClientDownload($access, $user, $_GET['document']);
    elseif ($op === 'admin-download') {
        $row = (new AlchemizePortalAdminRepository($db))->findSubmission($_GET['submission'], false);
        if (!$row) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Not found');
        $storage->sendPrivateFile($row['storage_key'], $row['original_filename'], $row['mime_type'], true);
    } elseif ($op === 'resubmit') { $db->exec("UPDATE documents_metadata SET status='replacement_requested' WHERE id=1"); $result = []; }
    elseif ($op === 'state') $result = ['documents' => $db->query('SELECT * FROM documents_metadata ORDER BY id')->fetchAll(), 'submissions' => $db->query('SELECT * FROM document_submissions ORDER BY id')->fetchAll(), 'clients' => $db->query('SELECT * FROM clients ORDER BY id')->fetchAll(), 'google' => json_decode(file_get_contents($root . '/google.json'), true)];
    elseif ($op === 'health') $result = $drive->verifyConnection();
    elseif ($op === 'legacy') {
        $key = '1/' . str_repeat('a', 48) . '.pdf'; @mkdir($root . '/staging/1', 0700, true); file_put_contents($root . '/staging/' . $key, '%PDF-legacy');
        $result = ['bytes' => $storage->readPrivateFile($key)]; unlink($root . '/staging/' . $key);
    } else throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Not found');
    echo json_encode($result);
} catch (AlchemizeRequestException $error) { http_response_code($error->httpStatus); echo json_encode(['error' => $error->errorCode]); }
catch (Throwable $error) { http_response_code(500); echo json_encode(['error' => get_class($error), 'message' => $error->getMessage()]); }
