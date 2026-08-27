<?php

declare(strict_types=1);

final class AlchemizePortalAdminService
{
    public function __construct(
        private readonly AlchemizePortalAdminRepository $repository,
        private readonly AlchemizeActivityRepository $activities,
        private readonly AlchemizeAuditEventRepository $audit,
        private readonly AlchemizeNotificationService $notifications,
        private readonly ?AlchemizePortalAccountService $accounts = null,
        private readonly ?AlchemizeExternalIntegrationService $integrations = null,
    ) {}

    public function attention(): array { return ['items' => $this->repository->attention()]; }

    public function accessGrants(?int $clientId): array { return ['items' => $this->repository->listAccessGrants($clientId)]; }

    public function updateAccessGrant(string $id, array $user, array $payload): array
    {
        $role=(string)($payload['access_role']??'');$status=(string)($payload['status']??'');
        if(!in_array($role,['authorized_user','billing_contact','document_contact','read_only'],true)
            || !in_array($status,['active','revoked'],true)) throw new AlchemizeRequestException(422,'VALIDATION_ERROR','Select a valid access role and state.');
        if(!$this->repository->updateAccessGrant($id,$role,$status,(int)$user['user_id']))$this->notFound();
        return ['id'=>$id,'access_role'=>$role,'status'=>$status];
    }

    public function reply(string $threadId, array $user, array $payload): array
    {
        $body = trim((string) ($payload['message'] ?? ''));
        if ($body === '' || alchemize_text_length($body) > 5000) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'A message of 5,000 characters or fewer is required.');
        $database = $this->repository->database(); $database->beginTransaction();
        try {
            $thread = $this->repository->replyToThread($threadId, (int) $user['user_id'], $body);
            if ($thread === null) $this->notFound();
            $this->activities->create([
                'public_id' => alchemize_uuid_v4(), 'event_type' => 'admin.message.sent', 'actor_type' => 'staff',
                'actor_user_id' => $user['user_id'], 'entity_type' => 'message_thread', 'entity_id' => $threadId,
                'client_id' => $thread['client_id'], 'summary' => 'Alchemize replied to a secure portal conversation.', 'visibility' => 'both',
            ]);
            $this->notifications->notifyClient(
                (int) $thread['client_id'], 'admin.message.sent', 'message_thread', $threadId,
                'New message from Alchemize', 'Alchemize replied to your secure conversation.',
                'admin-message:' . $threadId . ':' . microtime(true),
            );
            $database->commit(); return ['thread_id' => $threadId];
        } catch (Throwable $error) {
            if ($database->inTransaction()) $database->rollBack(); throw $error;
        }
    }

    public function threads(): array
    {
        return ['items' => $this->repository->listThreads()];
    }

    public function thread(string $threadId): array
    {
        $thread = $this->repository->getThread($threadId, true);
        if ($thread === null) $this->notFound();
        return $thread;
    }

    public function updateThread(string $threadId, array $user, array $payload): array
    {
        $status = (string) ($payload['status'] ?? '');
        $allowed = ['open', 'waiting_on_client', 'waiting_on_alchemize', 'resolved', 'archived'];
        if (!in_array($status, $allowed, true)) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a valid conversation state.');
        }
        $thread = $this->repository->updateThreadState($threadId, $status, $status === 'waiting_on_client');
        if ($thread === null) $this->notFound();
        $this->activities->create([
            'public_id' => alchemize_uuid_v4(),
            'event_type' => $status === 'resolved' ? 'admin.message.resolved' : 'admin.message.status_changed',
            'actor_type' => 'staff', 'actor_user_id' => $user['user_id'],
            'entity_type' => 'message_thread', 'entity_id' => $threadId,
            'client_id' => $thread['client_id'],
            'summary' => $status === 'resolved' ? 'Alchemize resolved a secure portal conversation.' : 'Alchemize updated a secure portal conversation.',
            'visibility' => 'both',
        ]);
        return ['thread_id' => $threadId, 'status' => $status];
    }

    public function linkThread(string $threadId, array $payload): array
    {
        $type = trim((string) ($payload['related_entity_type'] ?? ''));
        $id = trim((string) ($payload['related_entity_id'] ?? ''));
        if (!in_array($type, ['service', 'engagement', 'task', 'document', 'appointment', 'invoice'], true) || !preg_match('/^[a-f0-9-]{36}$/i', $id)) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a valid related client record.');
        }
        if ($this->repository->linkThread($threadId, $type, $id) === null) $this->notFound();
        return ['thread_id' => $threadId, 'related_entity_type' => $type, 'related_entity_id' => $id];
    }

    public function resolve(string $type, string $id, string $decision, array $user, array $payload): array
    {
        $allowed = match ($type) {
            'appointment', 'profile', 'access' => ['approved', 'rejected'],
            'document' => ['accept', 'replacement'],
            'task', 'message' => ['reviewed'],
            default => [],
        };
        if (!in_array($decision, $allowed, true)) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a valid resolution.');
        $note = trim((string) ($payload['note'] ?? '')) ?: null;
        $internalNote = trim((string) ($payload['internal_note'] ?? '')) ?: null;
        $database = $this->repository->database(); $database->beginTransaction();
        try {
            if ($type === 'appointment') {
                $row = $this->repository->findAppointmentRequest($id, true);
                if ($row === null) $this->notFound();
                if ($row['status'] !== 'pending') $this->conflict();
                $this->repository->resolveAppointmentRequest((int) $row['id'], (int) $row['appointment_id'], $decision, (int) $user['user_id'], $note, $row['requested_at_value'], $row['request_type']);
                $entityType = 'appointment'; $entityId = $row['appointment_public_id']; $clientId = $row['client_id']; $engagementId = $row['engagement_id'];
            } elseif ($type === 'profile') {
                $row = $this->repository->findProfileChange($id, true);
                if ($row === null) $this->notFound();
                if ($row['status'] !== 'pending') $this->conflict();
                $this->repository->resolveProfileChange($row, $decision, (int) $user['user_id'], $note);
                $entityType = 'profile_change'; $entityId = $id; $clientId = $row['client_id']; $engagementId = null;
            } elseif ($type === 'document') {
                $row = $this->repository->findSubmission($id, true);
                if ($row === null) $this->notFound();
                if (!in_array($row['status'], ['received', 'under_review'], true)) $this->conflict();
                $this->repository->reviewSubmission($row, $decision, (int) $user['user_id'], $note, $internalNote);
                $entityType = 'document'; $entityId = $row['document_public_id']; $clientId = $row['client_id']; $engagementId = $row['engagement_id'];
            } elseif ($type === 'access') {
                $row = $this->repository->findAccessRequest($id, true);
                if ($row === null) $this->notFound();
                if ($row['status'] !== 'pending') $this->conflict();
                $portalProvisioning = null;
                if ($decision === 'approved' && empty($row['target_user_id'])) {
                    if ($this->accounts === null) throw new RuntimeException('Portal account service is unavailable.');
                    $portalProvisioning = $this->accounts->provisionAuthorized((int)$row['client_id'],(string)$row['email'],(string)$row['name'],(string)$row['requested_access_role'],(int)$user['user_id']);
                    $row['target_user_id']=$portalProvisioning['_user_id'];unset($portalProvisioning['_user_id']);
                }
                $this->repository->resolveAccessRequest($row, $decision, (int) $user['user_id'], $note);
                $entityType = 'client_access'; $entityId = $id; $clientId = $row['client_id']; $engagementId = null;
            } elseif ($type === 'task') {
                $row = $this->repository->reviewTaskAction($id, (int) $user['user_id']);
                if ($row === null) $this->notFound();
                $entityType = 'task'; $entityId = $row['task_public_id']; $clientId = $row['client_id']; $engagementId = $row['engagement_id'];
            } elseif ($type === 'message') {
                $this->repository->markClientMessagesRead($id);
                $entityType = 'message_thread'; $entityId = $id; $clientId = null; $engagementId = null;
            } else $this->notFound();
            $eventType = 'admin.portal.' . $type . '.' . $decision;
            $this->activities->create([
                'public_id' => alchemize_uuid_v4(), 'event_type' => $eventType, 'actor_type' => 'staff',
                'actor_user_id' => $user['user_id'], 'entity_type' => $entityType, 'entity_id' => $entityId,
                'client_id' => $clientId, 'engagement_id' => $engagementId, 'summary' => 'Alchemize reviewed a client portal request.', 'visibility' => $clientId === null ? 'admin' : 'both',
            ]);
            $this->audit->create([
                'public_id' => alchemize_uuid_v4(), 'actor_user_id' => $user['user_id'], 'event_type' => $eventType,
                'entity_type' => $entityType, 'entity_id' => $entityId, 'action_summary' => 'Staff resolved a client portal request.', 'request_metadata' => null,
            ]);
            if ($clientId !== null && in_array($type, ['appointment', 'document', 'access'], true)) {
                $this->notifications->notifyClient(
                    (int) $clientId, $eventType, $entityType, $entityId,
                    $type === 'document' ? 'Document update' : ($type === 'access' ? 'Authorized-user request update' : 'Appointment update'),
                    'Alchemize updated a record in your client portal.',
                    'admin-resolution:' . $type . ':' . $id . ':' . $decision,
                );
            }
            $database->commit();
            $sync = $type === 'appointment' && isset($row['appointment_id']) && $this->integrations !== null
                ? $this->integrations->synchronizeAppointment((int) $row['appointment_id']) : null;
            return ['id' => $id, 'decision' => $decision] + ($sync === null ? [] : ['calendar_sync_status' => $sync['status']]) + ($portalProvisioning ?? []);
        } catch (Throwable $error) {
            if ($database->inTransaction()) $database->rollBack(); throw $error;
        }
    }

    private function notFound(): never { throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested portal action was not found.'); }
    private function conflict(): never { throw new AlchemizeRequestException(409, 'STATE_CONFLICT', 'This request has already been resolved.'); }
}
