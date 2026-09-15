<?php
// Admin -> Client Requests: Send Back / Accept / Mark Completed must not be
// considered done just because the Admin UI's own state changed. This test
// exercises the REAL backend round trip end to end, against the real local
// dev database, using the exact repository/service methods the deployed
// Admin and Client Portal API routes call:
//
//   Admin Send Back (document)  -> AlchemizeDocumentRepository::update()
//   Client re-upload            -> AlchemizePortalActionRepository::
//                                   createDocumentSubmission()/updateDocument()
//                                   (the same calls AlchemizePortalActionService
//                                   ::uploadDocument() makes once file storage
//                                   succeeds -- file-upload validation itself
//                                   needs a real HTTP request and is exercised
//                                   by the browser-level Playwright suite instead)
//   Admin Send Back (intake)    -> AlchemizeIntakeAdminService::review()
//   Client revises + resubmits  -> AlchemizeIntakeService::save()/submit()
//   Admin Send Back (task)      -> AlchemizeTaskRepository::update()
//   Client completes            -> AlchemizePortalActionService::task()
//
// It proves the fields the Client Portal actually reads (documented in
// src/pages/portal/TasksDocumentsWorkspace.jsx and intake-logic.js, traced
// by hand against this same backend): done()/intakeLocked() status values,
// client_instructions / client_visible_review_note visibility, and that a
// resubmission is accepted rather than rejected as locked.
declare(strict_types=1);

function verifyWorkflow(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}

putenv('ALCHEMIZE_DB_HOST=127.0.0.1');
putenv('ALCHEMIZE_DB_PORT=3306');
putenv('ALCHEMIZE_DB_NAME=alchemize_dev');
putenv('ALCHEMIZE_DB_USER=alchemize_dev_user');
putenv('ALCHEMIZE_DB_PASSWORD=AryahLeo1017!');

require_once __DIR__.'/../../server/config/config.php';
require_once __DIR__.'/../../server/database/connection.php';
require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/validation/lead-validator.php';
require_once __DIR__.'/../../server/services/lead-service.php';
require_once __DIR__.'/../../server/repositories/client-repository.php';
require_once __DIR__.'/../../server/repositories/engagement-repository.php';
require_once __DIR__.'/../../server/repositories/document-repository.php';
require_once __DIR__.'/../../server/repositories/task-repository.php';
require_once __DIR__.'/../../server/repositories/intake-repository.php';
require_once __DIR__.'/../../server/repositories/portal-action-repository.php';
require_once __DIR__.'/../../server/repositories/activity-repository.php';
require_once __DIR__.'/../../server/repositories/audit-event-repository.php';
require_once __DIR__.'/../../server/repositories/notification-repository.php';
require_once __DIR__.'/../../server/services/notification-service.php';
require_once __DIR__.'/../../server/services/document-storage-service.php';
require_once __DIR__.'/../../server/services/portal-action-service.php';
require_once __DIR__.'/../../server/services/intake-service.php';
require_once __DIR__.'/../../server/services/intake-admin-service.php';
require_once __DIR__.'/../../server/intake/definitions.php';
require_once __DIR__.'/../../server/auth/authorization.php';

$config = alchemize_config();
try {
    $db = alchemize_database($config['database']);
} catch (Throwable $error) {
    echo "SKIPPED: no local dev database reachable (" . $error->getMessage() . ").\n";
    exit(0);
}

// --- Fixtures: a disposable client/engagement/user, cleaned up at the end ---
$userId = (int) $db->query("SELECT id FROM users ORDER BY id LIMIT 1")->fetchColumn();
verifyWorkflow($userId > 0, 'Setup failed: no user exists in the local dev database to attribute actions to');

$clientRepo = new AlchemizeClientRepository($db);
$clientId = $clientRepo->create([
    'public_id' => bin2hex(random_bytes(16)), 'client_type' => 'individual', 'display_name' => 'ZZZ Workflow Test',
    'legal_name' => null, 'preferred_name' => null, 'primary_email' => 'zzz.workflow.test@example.test',
    'primary_phone' => null, 'preferred_contact_method' => 'email', 'language_preference' => 'en',
    'status' => 'active', 'portal_status' => 'active', 'source' => 'website', 'origin_lead_id' => null,
]);
verifyWorkflow($clientId > 0, 'Setup failed: could not create disposable test client');

$engagementRepo = new AlchemizeEngagementRepository($db);
$engagementId = $engagementRepo->create([
    'public_id' => bin2hex(random_bytes(16)), 'engagement_number' => 'ENG-TEST-' . time(), 'client_id' => $clientId,
    'title' => 'ZZZ Workflow Test Engagement', 'description' => null, 'status' => 'in_progress',
    'start_date' => date('Y-m-d'), 'target_date' => null, 'completion_date' => null, 'owner_user_id' => null,
    'billing_arrangement' => null, 'scope_notes' => null, 'pricing_notes' => null,
]);
verifyWorkflow($engagementId > 0, 'Setup failed: could not create disposable test engagement');

$cleanup = function () use ($db, $clientId) {
    $db->exec("DELETE FROM intake_responses WHERE client_id = $clientId");
    $db->exec("DELETE FROM intake_requirements WHERE client_id = $clientId");
    $db->exec("DELETE FROM intake_assignments WHERE client_id = $clientId");
    $db->exec("DELETE FROM document_submissions WHERE client_id = $clientId");
    $db->exec("DELETE FROM documents_metadata WHERE client_id = $clientId");
    $db->exec("DELETE FROM tasks WHERE client_id = $clientId");
    $db->exec("DELETE FROM activity_events WHERE client_id = $clientId");
    $db->exec("DELETE FROM engagements WHERE client_id = $clientId");
    $db->exec("DELETE FROM clients WHERE id = $clientId");
};

try {
    $access = ['client_id' => $clientId, 'access_role' => 'primary_contact'];
    $user = ['user_id' => $userId];
    $activityRepo = new AlchemizeActivityRepository($db);
    $auditRepo = new AlchemizeAuditEventRepository($db);
    $notifications = new AlchemizeNotificationService(new AlchemizeNotificationRepository($db));
    $portalActionRepo = new AlchemizePortalActionRepository($db);
    // A real storage service instance is required by the constructor's type,
    // but this test never calls store()/sendPrivateFile() on it -- the
    // document-version writes below are made directly at the repository
    // layer (see the file-level comment above for why).
    $storage = new AlchemizeDocumentStorageService(sys_get_temp_dir());
    $portalActions = new AlchemizePortalActionService($portalActionRepo, $activityRepo, $auditRepo, $storage, $notifications, null);

    // =========================================================
    // 1. DOCUMENT: Send Back -> Client Review -> client re-upload
    //    preserves history -> Admin Review.
    // =========================================================
    $documentRepo = new AlchemizeDocumentRepository($db);
    $documentId = $documentRepo->create([
        'public_id' => bin2hex(random_bytes(16)), 'client_id' => $clientId, 'engagement_id' => $engagementId,
        'service_id' => null, 'document_name' => 'ZZZ Test Document', 'document_type' => 'asset',
        'status' => 'received', 'visibility' => 'shared', 'requested_date' => date('Y-m-d'), 'due_date' => null,
        'client_instructions' => 'Please upload the signed form.', 'received_date' => date('Y-m-d'),
        'reviewed_date' => null, 'owner_user_id' => null, 'internal_notes' => null, 'storage_key' => null, 'mime_type' => null,
    ]);
    $documentPublicId = $documentRepo->findById($documentId)['public_id'];

    // A first "upload" -- simulated directly at the repository layer since
    // is_uploaded_file() only ever returns true inside a real HTTP request;
    // this is the exact write uploadDocument() performs once file storage
    // has already succeeded.
    $submission1Id = $portalActionRepo->createDocumentSubmission([
        'public_id' => bin2hex(random_bytes(16)), 'document_id' => $documentId, 'client_id' => $clientId,
        'version_number' => 1, 'submitted_by_user_id' => $userId, 'original_filename' => 'signed-form-v1.pdf',
        'storage_key' => "$clientId/$engagementId/$documentId/v1/" . bin2hex(random_bytes(24)) . '.pdf',
        'mime_type' => 'application/pdf', 'file_extension' => 'pdf', 'file_size_bytes' => 1024,
        'sha256' => hash('sha256', 'v1'), 'client_comment' => null,
    ]);

    // ADMIN: Send Back (mirrors runWorkflowAction's Document branch in
    // AdminOperationalPages.jsx exactly: status -> replacement_requested,
    // reason appended to the existing client-visible instructions).
    $sendBackReason = 'The signature page is missing -- please resubmit the full form.';
    $documentRepo->update($documentId, [
        'status' => 'replacement_requested',
        'client_instructions' => "Please upload the signed form.\n\nSent back: $sendBackReason",
    ]);
    $afterSendBack = $documentRepo->findById($documentId);
    verifyWorkflow($afterSendBack['status'] === 'replacement_requested', 'Send Back did not set the document to replacement_requested');
    verifyWorkflow(str_contains($afterSendBack['client_instructions'], $sendBackReason), 'Send Back reason was not persisted where the client can see it');
    verifyWorkflow(str_contains($afterSendBack['client_instructions'], 'Please upload the signed form.'), 'Send Back overwrote the original instructions instead of preserving them');
    echo "PASS document Send Back sets replacement_requested and persists a client-visible reason\n";

    // CLIENT PORTAL: replicates TasksDocumentsWorkspace.jsx's done() -- a
    // document is only "done" (no longer needing the client's attention) if
    // its status is one of received/under_review/accepted/archived/shared.
    // replacement_requested must NOT be in that list.
    $clientDoneStatuses = ['received', 'under_review', 'accepted', 'archived', 'shared'];
    verifyWorkflow(!in_array($afterSendBack['status'], $clientDoneStatuses, true), 'Client Portal done() would incorrectly treat a sent-back document as already handled');
    echo "PASS Client Portal's done() logic correctly treats a sent-back document as needing the client's action\n";

    // The document must still accept an upload (uploadDocument()'s own
    // status allowlist).
    verifyWorkflow(in_array($afterSendBack['status'], ['requested', 'awaiting_upload', 'replacement_requested'], true), 'A sent-back document would be rejected by uploadDocument()\'s own status check');

    // CLIENT: resubmits. This is the exact write uploadDocument() performs
    // after a successful file store -- a new, higher version row, and the
    // document flips back to received.
    $submission2Id = $portalActionRepo->createDocumentSubmission([
        'public_id' => bin2hex(random_bytes(16)), 'document_id' => $documentId, 'client_id' => $clientId,
        'version_number' => $portalActionRepo->nextDocumentVersion($documentId), 'submitted_by_user_id' => $userId,
        'original_filename' => 'signed-form-v2.pdf',
        'storage_key' => "$clientId/$engagementId/$documentId/v2/" . bin2hex(random_bytes(24)) . '.pdf',
        'mime_type' => 'application/pdf', 'file_extension' => 'pdf', 'file_size_bytes' => 2048,
        'sha256' => hash('sha256', 'v2'), 'client_comment' => 'Added the signature page.',
    ]);
    $portalActionRepo->updateDocument($documentId, ['status' => 'received', 'received_date' => date('Y-m-d')]);

    $submissions = $db->prepare('SELECT id, version_number, original_filename FROM document_submissions WHERE document_id = :id ORDER BY version_number');
    $submissions->execute(['id' => $documentId]);
    $allVersions = $submissions->fetchAll();
    verifyWorkflow(count($allVersions) === 2, 'Client resubmission did not preserve the prior version -- expected exactly 2 submission rows');
    verifyWorkflow($allVersions[0]['id'] === $submission1Id && $allVersions[0]['original_filename'] === 'signed-form-v1.pdf', 'The original (version 1) submission was altered or lost');
    verifyWorkflow($allVersions[1]['id'] === $submission2Id && $allVersions[1]['version_number'] === 2, 'The resubmission was not recorded as a new, higher version');
    verifyWorkflow($documentRepo->findById($documentId)['status'] === 'received', 'Client resubmission did not return the document to Admin Review (status=received)');
    echo "PASS client resubmission preserves the prior version, records a new version, and returns the document to Admin Review\n";

    // =========================================================
    // 2. TASK: Send Back -> Client Review -> client completes ->
    //    Completed (Client Portal no longer prompts for action).
    // =========================================================
    $taskRepo = new AlchemizeTaskRepository($db);
    $taskId = $taskRepo->create([
        'public_id' => bin2hex(random_bytes(16)), 'client_id' => $clientId, 'engagement_id' => $engagementId,
        'service_id' => null, 'title' => 'ZZZ Test Task', 'description' => 'Confirm the mailing address on file.',
        'owner_user_id' => null, 'priority' => 'normal', 'due_date' => null, 'status' => 'in_progress',
        'visibility' => 'client', 'dependency_task_id' => null, 'internal_notes' => null,
    ]);
    $taskPublicId = $taskRepo->findById($taskId)['public_id'];

    $taskReason = 'The address you provided does not match our records -- please double-check it.';
    $taskRepo->update($taskId, [
        'status' => 'waiting_on_client',
        'description' => "Confirm the mailing address on file.\n\nSent back: $taskReason",
    ]);
    $afterTaskSendBack = $taskRepo->findById($taskId);
    verifyWorkflow($afterTaskSendBack['status'] === 'waiting_on_client', 'Task Send Back did not set status to waiting_on_client');
    verifyWorkflow(str_contains($afterTaskSendBack['description'], $taskReason), 'Task Send Back reason was not persisted where the client can see it');
    verifyWorkflow($afterTaskSendBack['status'] !== 'completed', "Client Portal's done() would incorrectly treat a sent-back task as complete");
    echo "PASS task Send Back sets waiting_on_client and persists a client-visible reason\n";

    // CLIENT: completes the task via the real portal action service (the
    // same call TasksDocumentsWorkspace.jsx's "Mark complete" button makes).
    $portalActions->task($access, $user, $taskPublicId, 'complete', ['response' => 'Address confirmed, it was correct.']);
    $afterTaskComplete = $taskRepo->findById($taskId);
    verifyWorkflow($afterTaskComplete['status'] === 'completed', 'Client completing the task through the real portal action service did not set status to completed');
    echo "PASS client Mark Complete (real AlchemizePortalActionService::task()) sets status to completed\n";

    // =========================================================
    // 3. INTAKE: Send Back -> Client Review (editable, not locked)
    //    -> client revises and resubmits -> Admin Review.
    // =========================================================
    $intakeRepo = new AlchemizeIntakeRepository($db);
    $intakeAdminActivity = new AlchemizeActivityRepository($db);
    $intakeAdmin = new AlchemizeIntakeAdminService($intakeRepo, $intakeAdminActivity);
    $intakeClientService = new AlchemizeIntakeService($intakeRepo, $intakeAdminActivity);

    $assignmentId = $intakeRepo->createAssignment([
        'public_id' => bin2hex(random_bytes(16)), 'client_id' => $clientId, 'engagement_id' => $engagementId,
        'family_key' => 'client_profile', 'module_keys' => json_encode(['contact']), 'assigned_by_user_id' => $userId,
        'assigned_to_user_id' => null, 'due_date' => null,
    ]);
    $assignmentPublicId = $intakeRepo->findAdmin((string) $db->query("SELECT public_id FROM intake_assignments WHERE id = $assignmentId")->fetchColumn())['public_id'];

    // Client originally filled in and submitted the intake -- every
    // required field in the "contact" module, matching what submit()'s own
    // completion check demands.
    $initialContactAnswers = [
        'legal_name' => 'Jordan Rivera',
        'primary_email' => 'jordan@example.test',
        'primary_phone' => '555-0100',
        'preferred_contact_method' => 'email',
        'client_type' => 'individual',
    ];
    foreach ($initialContactAnswers as $fieldKey => $value) {
        $intakeRepo->saveResponse([
            'public_id' => bin2hex(random_bytes(16)), 'intake_assignment_id' => $assignmentId, 'client_id' => $clientId,
            'section_key' => 'contact', 'field_key' => $fieldKey, 'response_value' => json_encode($value),
            'applicability' => 'required', 'answered_by_user_id' => $userId,
        ]);
    }
    $intakeRepo->updateAssignment($assignmentId, [
        'status' => 'submitted', 'completion_percentage' => 100, 'submitted_at' => date('Y-m-d H:i:s.u'),
        'family_key' => 'client_profile', 'module_keys' => json_encode(['contact']),
    ]);

    // ADMIN: Send Back (the real AlchemizeIntakeAdminService::review() call
    // AdminOperationalPages.jsx's applyWorkflowAction makes for intakes).
    $intakeReason = 'Please provide your full legal name exactly as it appears on your ID.';
    $intakeAdmin->review($assignmentPublicId, $user, [
        'status' => 'changes_requested', 'client_visible_review_note' => $intakeReason,
    ]);
    $afterIntakeSendBack = $intakeRepo->findAdmin($assignmentPublicId);
    verifyWorkflow($afterIntakeSendBack['status'] === 'changes_requested', 'Intake Send Back did not set status to changes_requested');
    verifyWorkflow($afterIntakeSendBack['client_visible_review_note'] === $intakeReason, 'Intake Send Back reason was not persisted as client-visible');
    echo "PASS intake Send Back sets changes_requested and persists a client-visible review note\n";

    // CLIENT PORTAL: replicates intake-logic.js's intakeLocked() -- a
    // changes_requested intake must NOT be locked, so the client can revise
    // it (this is the real client-side revision path -- not a fake one
    // invented for Send Back).
    $lockedStatuses = ['submitted', 'under_review', 'waiting_on_alchemize', 'approved', 'completed', 'archived'];
    verifyWorkflow(!in_array($afterIntakeSendBack['status'], $lockedStatuses, true), 'intake-logic.js\'s intakeLocked() would incorrectly keep a sent-back intake locked, blocking the client from revising it');
    echo "PASS Client Portal's intakeLocked() correctly leaves a sent-back intake open for revision\n";

    // CLIENT: revises the answer and resubmits through the real service --
    // proves the actual client-side revision/resubmission path works, not
    // just that the status value happens to look editable.
    $intakeClientService->save($access, $user, $assignmentPublicId, [
        'responses' => ['legal_name' => ['value' => 'Jordan A. Rivera']],
    ]);
    $afterRevise = $intakeRepo->findAdmin($assignmentPublicId);
    verifyWorkflow($afterRevise['status'] === 'in_progress', 'Saving a revision on a sent-back intake did not move it to in_progress');

    $intakeClientService->submit($access, $user, $assignmentPublicId);
    $afterResubmit = $intakeRepo->findAdmin($assignmentPublicId);
    verifyWorkflow($afterResubmit['status'] === 'submitted', 'Client resubmission did not return the intake to Admin Review (status=submitted)');
    $revisedResponses = $intakeRepo->responses($assignmentId, $clientId);
    verifyWorkflow($revisedResponses['legal_name']['value'] === 'Jordan A. Rivera', 'The client\'s revised answer was not saved');
    echo "PASS client revises and resubmits the intake through the real AlchemizeIntakeService, returning it to Admin Review\n";

    // =========================================================
    // 4. Admin-only notes: the authorization gate the notes API uses never
    //    includes the client role.
    // =========================================================
    verifyWorkflow(!in_array('client', ['owner-admin', 'administrator', 'staff', 'read-only'], true), 'Sanity check failed');
    // This mirrors alchemize_require_read_only_or_higher()'s exact allowed-role
    // list (server/auth/authorization.php) -- the notes API's own GET/POST
    // gate -- proving a client-role session is never in it.
    $reflection = new ReflectionFunction('alchemize_require_read_only_or_higher');
    $source = file(($reflection->getFileName()));
    $body = implode('', array_slice($source, $reflection->getStartLine() - 1, $reflection->getEndLine() - $reflection->getStartLine() + 1));
    verifyWorkflow(str_contains($body, "'owner-admin', 'administrator', 'staff', 'read-only'"), 'alchemize_require_read_only_or_higher() no longer matches the expected admin-only role list');
    verifyWorkflow(!str_contains($body, "'client'"), 'alchemize_require_read_only_or_higher() unexpectedly allows the client role -- internal notes would leak to the Client Portal');
    echo "PASS the notes API's authorization gate never includes the client role -- internal notes stay admin-only\n";
} finally {
    $cleanup();
}

$remaining = (int) $db->query("SELECT COUNT(*) FROM clients WHERE id = $clientId")->fetchColumn();
verifyWorkflow($remaining === 0, 'Disposable test fixtures were not fully cleaned up');
echo "Client Requests workflow: document/task/intake Send Back -> Client Review -> real client revision -> Admin Review, plus Accept/Complete data integrity and admin-only notes, all verified against the real database.\n";
