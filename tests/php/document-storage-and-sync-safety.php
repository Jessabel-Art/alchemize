<?php

declare(strict_types=1);
require_once __DIR__ . '/../../server/http/request.php';
require_once __DIR__ . '/../../server/services/document-storage-service.php';
require_once __DIR__ . '/../../server/repositories/external-integration-repository.php';
require_once __DIR__ . '/../../server/services/external-integration-service.php';

function verifyStorage(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
function rejectsStorage(callable $operation, string $code): void {
    try {
        $operation();
    } catch (AlchemizeRequestException $error) {
        verifyStorage($error->errorCode === $code, 'Unexpected error: ' . $error->errorCode);
        return;
    }
    throw new RuntimeException('Expected ' . $code);
}

// --- resolveStorageKeyPath() / resolveDisposition() ---
// A production file-view request for a real, valid document_submissions
// row returned NOT_FOUND. Traced to server/services/portal-action-service.php
// uploadDocument(): a post-commit Drive-sync failure was caught by the same
// try/catch that discards the just-stored file on a genuine upload failure,
// so a *successful, already-committed* upload had its file deleted out from
// under its own database row the instant a best-effort Drive sync failed.
// These first assertions cover the smaller, directly-related fix: the
// backend must authoritatively decide inline vs. attachment from the real
// MIME type, and a well-formed key whose file is missing (exactly this
// orphaned state) must still fail closed with a clean 404 rather than a
// raw filesystem error.
$root = sys_get_temp_dir() . '/alchemize-storage-test-' . bin2hex(random_bytes(6));
mkdir($root . '/9/0/1/v1', 0700, true);
$goodPath = $root . '/9/0/1/v1/' . str_repeat('a', 48) . '.jpg';
file_put_contents($goodPath, 'fake-jpeg-bytes');
$storage = new AlchemizeDocumentStorageService($root);

$resolved = $storage->resolveStorageKeyPath('9/0/1/v1/' . str_repeat('a', 48) . '.jpg');
verifyStorage(realpath($resolved) === realpath($goodPath), 'Valid versioned key did not resolve to the stored file');
echo "PASS a valid, existing versioned storage key resolves to its file\n";

rejectsStorage(fn() => $storage->resolveStorageKeyPath('not-a-real-key'), 'NOT_FOUND');
echo "PASS a malformed storage key is rejected before touching the filesystem\n";

rejectsStorage(fn() => $storage->resolveStorageKeyPath('9/0/1/v1/../../../../etc/passwd'), 'NOT_FOUND');
echo "PASS a path-traversal storage key is rejected\n";

// The exact production shape: a syntactically valid key whose row is real
// but whose file was deleted out from under it (the orphan this pass
// diagnosed) still 404s cleanly rather than throwing an unhandled error.
rejectsStorage(
    fn() => $storage->resolveStorageKeyPath('9/2/3/v1/' . str_repeat('b', 48) . '.png'),
    'NOT_FOUND',
);
echo "PASS a well-formed key whose file no longer exists on disk fails closed with NOT_FOUND\n";

verifyStorage($storage->resolveDisposition('application/pdf', true) === 'inline', 'PDF preview should be inline');
verifyStorage($storage->resolveDisposition('image/png', true) === 'inline', 'PNG preview should be inline');
verifyStorage($storage->resolveDisposition('image/jpeg', true) === 'inline', 'JPEG preview should be inline');
verifyStorage($storage->resolveDisposition('image/webp', true) === 'inline', 'WebP preview should be inline');
verifyStorage(
    $storage->resolveDisposition('application/vnd.openxmlformats-officedocument.wordprocessingml.document', true) === 'attachment',
    'A caller asking to preview a non-previewable type must still be forced to attachment',
);
verifyStorage($storage->resolveDisposition('application/pdf', false) === 'attachment', 'Download Original must stay attachment even for a previewable type');
echo "PASS disposition is decided authoritatively from the real MIME type, not just the caller's request\n";

array_map('unlink', glob($root . '/9/0/1/v1/*'));
@rmdir($root . '/9/0/1/v1'); @rmdir($root . '/9/0/1'); @rmdir($root . '/9/0'); @rmdir($root . '/9'); @rmdir($root);

// --- synchronizeDocument() hardening ---
// Recording Drive-sync state is a best-effort side note on an already
// stored, already committed file. Before this pass, the early-return path
// (Drive not configured / folder sync not "synchronized") called
// setDocumentDriveState() completely unprotected -- if that UPDATE threw
// (exactly what happened in production while document_submissions was
// still missing its drive-sync columns, pre-migration-036), the exception
// propagated out of synchronizeDocument() into the caller's post-commit
// code, which discarded the file it had just successfully stored.
final class SyncSafetyPDO extends PDO {
    public function __construct() {}
    public function prepare(string $query, array $options = []): PDOStatement|false { return new SyncSafetyStatement($query); }
}
final class SyncSafetyStatement extends PDOStatement {
    public function __construct(private string $sql) {}
    public function execute(?array $params = null): bool {
        // Reproduces the real production failure: the UPDATE that records
        // sync state throws (originally: the drive-sync columns didn't
        // exist yet), while every SELECT this call chain depends on works
        // fine -- so the *only* broken thing is the best-effort bookkeeping.
        if (str_starts_with($this->sql, 'UPDATE')) {
            throw new PDOException("SQLSTATE[42S22]: Unknown column 'drive_sync_status'");
        }
        return true;
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed {
        if (str_contains($this->sql, 'FROM document_submissions')) {
            return ['id' => 1, 'public_id' => 'sub-1', 'client_id' => 9, 'document_id' => 1, 'original_filename' => 'f.jpg', 'mime_type' => 'image/jpeg', 'google_drive_folder_id' => null, 'google_drive_file_id' => null];
        }
        if (str_contains($this->sql, 'FROM clients')) {
            return ['id' => 9, 'public_id' => 'client-9', 'display_name' => 'Jessy', 'google_drive_folder_id' => null];
        }
        return false;
    }
}
$db = new SyncSafetyPDO();
$repository = new AlchemizeExternalIntegrationRepository($db);
$service = new AlchemizeExternalIntegrationService($repository, null, null, []);
$result = $service->synchronizeDocument(1, '/tmp/does-not-matter.jpg');
verifyStorage($result['status'] === 'not_configured', 'Sync should degrade to not_configured when Drive is unset');
echo "PASS synchronizeDocument() degrades gracefully instead of throwing when recording sync state fails\n";

// --- Structural proof of the ordering fix ---
// The actual bug was in the CALLER: uploadDocument() called
// synchronizeDocument() *inside* the try/catch whose catch block calls
// storage->discard() -- meaning any post-commit exception there deleted
// the just-uploaded file. Confirms the source no longer has that shape:
// the discard() call must not appear anywhere after the synchronizeDocument()
// call within the same function body.
$source = file_get_contents(__DIR__ . '/../../server/services/portal-action-service.php');
foreach (['uploadDocument', 'uploadGeneralDocument'] as $method) {
    $methodStart = strpos($source, 'function ' . $method . '(');
    verifyStorage($methodStart !== false, "Could not locate $method() in portal-action-service.php");
    $nextMethod = strpos($source, "\n    public function ", $methodStart + 20);
    $body = substr($source, $methodStart, ($nextMethod !== false ? $nextMethod : strlen($source)) - $methodStart);
    $discardPos = strpos($body, 'discard(');
    $syncPos = strpos($body, 'synchronizeDocument(');
    verifyStorage($syncPos !== false, "$method() no longer calls synchronizeDocument()");
    verifyStorage($discardPos === false || $discardPos < $syncPos, "$method() still has a discard() call after synchronizeDocument() -- a post-commit sync failure could delete the stored file again");
}
echo "PASS discard() never runs after the post-commit Drive-sync call in either upload path\n";
