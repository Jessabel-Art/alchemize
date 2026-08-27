<?php

declare(strict_types=1);

final class AlchemizePortalActionService
{
    public function __construct(
        private readonly AlchemizePortalActionRepository $repository,
        private readonly AlchemizeActivityRepository $activities,
        private readonly AlchemizeAuditEventRepository $audit,
        private readonly AlchemizeDocumentStorageService $storage,
        private readonly AlchemizeNotificationService $notifications,
        private readonly ?AlchemizeExternalIntegrationService $integrations = null,
    ) {}

    public function requestService(array $access, array $user, array $payload): array
    {
        $this->requireMutationAccess($access, ['primary_contact', 'authorized_user']);
        $allowed = ['individual-tax','individual-insurance','individual-notary','business-formation','business-operations','business-tax','business-advisory','business-insurance','business-notary'];
        $serviceKey = (string) ($payload['service_key'] ?? '');
        $message = trim((string) ($payload['message'] ?? ''));
        if (!in_array($serviceKey, $allowed, true) || $message === '') {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a service and describe what you need.');
        }
        $database = $this->repository->database();
        $database->beginTransaction();
        try {
            $publicId = alchemize_uuid_v4();
            $leadId = $this->repository->createServiceRequest([
                'public_id' => $publicId, 'full_name' => (string) $access['display_name'],
                'email' => (string) $access['primary_email'], 'phone' => $access['primary_phone'] ?: null,
                'audience' => $access['client_type'] === 'business' ? 'business' : 'individual',
                'service_key' => $serviceKey, 'message' => $message,
                'preferred_contact' => $access['preferred_contact_method'] ?: 'email',
                'language_preference' => $access['language_preference'] ?: 'en',
            ]);
            $this->activities->create([
                'public_id' => alchemize_uuid_v4(), 'event_type' => 'client.service.requested',
                'actor_type' => 'client', 'actor_user_id' => $user['user_id'], 'entity_type' => 'lead',
                'entity_id' => $publicId, 'lead_id' => $leadId, 'client_id' => $access['client_id'],
                'summary' => 'Client requested a new service.', 'visibility' => 'both',
            ]);
            $database->commit();
            return ['id' => $publicId, 'status' => 'new'];
        } catch (Throwable $error) {
            if ($database->inTransaction()) $database->rollBack();
            throw $error;
        }
    }

    public function requestAppointment(array $access, array $user, array $payload): array
    {
        $this->requireMutationAccess($access, ['primary_contact', 'authorized_user']);
        $scheduledAt = trim((string) ($payload['preferred_at'] ?? ''));
        if ($scheduledAt === '' || strtotime($scheduledAt) === false || strtotime($scheduledAt) <= time()) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Choose a future preferred appointment time.');
        }
        $engagementId = !empty($payload['engagement_id'])
            ? $this->repository->authorizedEngagementId((string) $payload['engagement_id'], (int) $access['client_id']) : null;
        $publicId = alchemize_uuid_v4();
        $this->repository->createAppointmentRequest([
            'public_id' => $publicId, 'client_id' => $access['client_id'], 'engagement_id' => $engagementId,
            'appointment_type' => trim((string) ($payload['appointment_type'] ?? 'Consultation')) ?: 'Consultation',
            'scheduled_at' => date('Y-m-d H:i:s', strtotime($scheduledAt)),
            'timezone' => trim((string) ($payload['timezone'] ?? 'UTC')) ?: 'UTC',
            'location_type' => trim((string) ($payload['location_type'] ?? 'virtual')) ?: 'virtual',
            'client_instructions' => $this->optionalText($payload['reason'] ?? null, 2000),
        ]);
        $this->activity($access, $user, 'client.appointment.requested', 'appointment', $publicId, 'Client requested an appointment.', $engagementId);
        return ['id' => $publicId, 'status' => 'requested'];
    }

    public function uploadGeneralDocument(array $access, array $user, array $file, array $payload): array
    {
        $this->requireMutationAccess($access, ['primary_contact', 'authorized_user', 'document_contact']);
        $engagementId = !empty($payload['engagement_id'])
            ? $this->repository->authorizedEngagementId((string) $payload['engagement_id'], (int) $access['client_id']) : null;
        $publicId = alchemize_uuid_v4();
        $name = trim((string) ($payload['document_name'] ?? pathinfo((string) ($file['name'] ?? 'Document'), PATHINFO_FILENAME))) ?: 'Client document';
        $documentId = $this->repository->createGeneralDocument([
            'public_id' => $publicId, 'client_id' => $access['client_id'], 'engagement_id' => $engagementId,
            'document_name' => $name, 'client_instructions' => $this->optionalText($payload['comment'] ?? null, 2000),
        ]);
        $stored = null;
        try {
            $stored = $this->storage->store($file, (int) $access['client_id'], $documentId, 1, $engagementId);
            $submissionId = $this->repository->createDocumentSubmission([
                'public_id' => alchemize_uuid_v4(), 'document_id' => $documentId, 'client_id' => $access['client_id'],
                'version_number' => 1, 'submitted_by_user_id' => $user['user_id'],
                'original_filename' => $stored['original_filename'], 'storage_key' => $stored['storage_key'],
                'mime_type' => $stored['mime_type'], 'file_extension' => $stored['file_extension'],
                'file_size_bytes' => $stored['file_size_bytes'], 'sha256' => $stored['sha256'],
                'client_comment' => $this->optionalText($payload['comment'] ?? null, 2000),
            ]);
        } catch (Throwable $error) {
            if (is_array($stored)) $this->storage->discard((string) ($stored['absolute_path'] ?? ''));
            $this->repository->deleteGeneralDocument($documentId, (int) $access['client_id']);
            throw $error;
        }
        $sync = $this->integrations?->synchronizeDocument($submissionId, (string) $stored['absolute_path']) ?? ['status' => 'not_configured'];
        $this->activity($access, $user, 'client.document.uploaded_general', 'document', $publicId, 'Client uploaded a general document.', $engagementId);
        return ['id' => $publicId, 'status' => 'received', 'drive_sync_status' => $sync['status']];
    }

    public function task(array $access, array $user, string $taskId, string $action, array $payload): array
    {
        $this->requireMutationAccess($access, ['primary_contact', 'authorized_user', 'document_contact']);
        $database = $this->repository->database();
        $database->beginTransaction();
        try {
            $task = $this->repository->findTask($taskId, (int) $access['client_id'], true);
            if ($task === null) $this->notFound();
            if (!in_array($action, ['complete', 'acknowledge', 'respond'], true)) $this->notFound();
            if ($action === 'complete' && $task['status'] === 'completed') {
                throw new AlchemizeRequestException(409, 'TASK_ALREADY_COMPLETED', 'This task has already been completed.');
            }
            $response = $this->optionalText($payload['response'] ?? null, 2000);
            if ($action === 'respond' && $response === null) {
                throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'A response is required.');
            }
            if ($action === 'complete') {
                $this->repository->updateTask((int) $task['id'], ['status' => 'completed', 'completed_at' => date('Y-m-d H:i:s.u')]);
            }
            if ($action === 'acknowledge') {
                $this->acknowledgeEntity($access, $user, 'task', $taskId, 'Task acknowledged.');
            }
            $actionType = $action === 'complete' ? 'completed' : ($action === 'respond' ? 'responded' : 'acknowledged');
            $taskActionId = alchemize_uuid_v4();
            $this->repository->createTaskAction([
                'public_id' => $taskActionId, 'task_id' => $task['id'], 'client_id' => $access['client_id'],
                'actor_user_id' => $user['user_id'], 'action_type' => $actionType, 'response_text' => $response,
            ]);
            $eventType = 'client.task.' . $actionType;
            $summary = $action === 'complete' ? 'Client completed task: ' . $task['title'] : 'Client ' . $actionType . ' task: ' . $task['title'];
            if ($action !== 'acknowledge') {
                $this->activity($access, $user, $eventType, 'task', $taskId, $summary, $task['engagement_id']);
                $this->notifications->notifyStaff(
                    $eventType, (int) $access['client_id'], 'task', $taskId,
                    $action === 'complete' ? 'Client completed a task' : 'Client responded to a task',
                    $task['title'], 'task-action:' . $taskActionId,
                );
            }
            $database->commit();
            return ['id' => $taskId, 'status' => $action === 'complete' ? 'completed' : $task['status'], 'action' => $actionType];
        } catch (Throwable $error) {
            if ($database->inTransaction()) $database->rollBack();
            throw $error;
        }
    }

    public function uploadDocument(array $access, array $user, string $documentId, array $file, ?string $comment): array
    {
        $this->requireMutationAccess($access, ['primary_contact', 'authorized_user', 'document_contact']);
        $document = $this->repository->findDocument($documentId, (int) $access['client_id']);
        if ($document === null) $this->notFound();
        if (!in_array($document['status'], ['requested', 'awaiting_upload', 'replacement_requested'], true)) {
            throw new AlchemizeRequestException(409, 'DOCUMENT_NOT_ACCEPTING_UPLOADS', 'This document request is not accepting another submission.');
        }
        $versionNumber = $this->repository->nextDocumentVersion((int) $document['id']);
        $stored = $this->storage->store(
            $file,
            (int) $access['client_id'],
            (int) $document['id'],
            $versionNumber,
            isset($document['engagement_id']) ? (int) $document['engagement_id'] : null,
        );
        $database = $this->repository->database();
        $database->beginTransaction();
        try {
            $locked = $this->repository->findDocument($documentId, (int) $access['client_id'], true);
            if ($locked === null || !in_array($locked['status'], ['requested', 'awaiting_upload', 'replacement_requested'], true)) {
                throw new AlchemizeRequestException(409, 'DOCUMENT_NOT_ACCEPTING_UPLOADS', 'This document request changed before the upload completed.');
            }
            $submissionId = $this->repository->createDocumentSubmission([
                'public_id' => alchemize_uuid_v4(), 'document_id' => $locked['id'], 'client_id' => $access['client_id'],
                'version_number' => $versionNumber,
                'submitted_by_user_id' => $user['user_id'], 'original_filename' => $stored['original_filename'],
                'storage_key' => $stored['storage_key'], 'mime_type' => $stored['mime_type'],
                'file_extension' => $stored['file_extension'], 'file_size_bytes' => $stored['file_size_bytes'],
                'sha256' => $stored['sha256'], 'client_comment' => $this->optionalText($comment, 2000),
            ]);
            $this->repository->updateDocument((int) $locked['id'], [
                'status' => 'received', 'received_date' => date('Y-m-d'),
                'storage_key' => $stored['storage_key'], 'mime_type' => $stored['mime_type'],
            ]);
            $this->activity($access, $user, 'client.document.uploaded', 'document', $documentId, 'Client uploaded requested document: ' . $locked['document_name'], $locked['engagement_id']);
            $this->audit($user, 'client.document.uploaded', 'document', $documentId, 'Client submitted a file through private document storage.');
            $this->notifications->notifyStaff(
                'client.document.uploaded', (int) $access['client_id'], 'document', $documentId,
                'Document uploaded', $locked['document_name'],
                'document-upload:' . $documentId . ':' . $versionNumber,
            );
            $database->commit();
            $sync = $this->integrations?->synchronizeDocument($submissionId, (string) $stored['absolute_path']) ?? ['status' => 'not_configured'];
            return ['id' => $documentId, 'status' => 'received', 'filename' => $stored['original_filename'], 'drive_sync_status' => $sync['status']];
        } catch (Throwable $error) {
            if ($database->inTransaction()) $database->rollBack();
            $this->storage->discard($stored['absolute_path']);
            throw $error;
        }
    }

    public function sendClientDownload(array $access, array $user, string $documentId): never
    {
        $download = $this->repository->findClientDownload($documentId, (int) $access['client_id']);
        if ($download === null) $this->notFound();
        $this->audit($user, 'client.document.downloaded', 'document', $documentId, 'Client downloaded an authorized document version.');
        $this->storage->sendPrivateFile(
            (string) $download['storage_key'],
            (string) $download['original_filename'],
            (string) $download['mime_type'],
        );
    }

    public function threads(array $access): array
    {
        return ['items' => $this->repository->listThreads((int) $access['client_id']), 'available' => true];
    }

    public function thread(array $access, string $threadId, bool $markRead = false): array
    {
        $thread = $this->repository->findThread($threadId, (int) $access['client_id']);
        if ($thread === null) $this->notFound();
        if ($markRead) $this->repository->markThreadRead((int) $thread['id'], (int) $access['client_id']);
        return ['thread' => $thread, 'messages' => $this->repository->listThreadMessages((int) $thread['id'], (int) $access['client_id'])];
    }

    public function sendMessage(array $access, array $user, ?string $threadId, array $payload): array
    {
        $this->requireMutationAccess($access, ['primary_contact', 'authorized_user', 'billing_contact', 'document_contact']);
        $body = $this->requiredText($payload['message'] ?? null, 5000, 'Message');
        $database = $this->repository->database();
        $database->beginTransaction();
        try {
            if ($threadId === null) {
                $subject = $this->requiredText($payload['subject'] ?? null, 180, 'Subject');
                $relatedType = $this->relatedType($payload['related_entity_type'] ?? null);
                $relatedId = $this->optionalText($payload['related_entity_id'] ?? null, 36);
                if (($relatedType === null) !== ($relatedId === null)) {
                    throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'A related record type and ID must be provided together.');
                }
                if ($relatedType !== null && !$this->repository->relatedEntityBelongsToClient($relatedType, (string) $relatedId, (int) $access['client_id'])) {
                    $this->notFound();
                }
                $threadId = alchemize_uuid_v4();
                $internalId = $this->repository->createThread([
                    'public_id' => $threadId, 'client_id' => $access['client_id'], 'subject' => $subject,
                    'related_entity_type' => $relatedType,
                    'related_entity_id' => $relatedId,
                    'created_by_user_id' => $user['user_id'],
                ]);
            } else {
                $thread = $this->repository->findThread($threadId, (int) $access['client_id'], true);
                if ($thread === null) $this->notFound();
                if ($thread['status'] === 'archived') throw new AlchemizeRequestException(409, 'THREAD_ARCHIVED', 'Archived conversations cannot receive new messages.');
                $internalId = (int) $thread['id'];
            }
            $messageId = alchemize_uuid_v4();
            $this->repository->createMessage([
                'public_id' => $messageId, 'thread_id' => $internalId, 'client_id' => $access['client_id'],
                'sender_user_id' => $user['user_id'], 'sender_type' => 'client', 'message_body' => $body,
                'read_by_client_at' => date('Y-m-d H:i:s.u'), 'read_by_admin_at' => null,
            ]);
            $this->activity($access, $user, 'client.message.sent', 'message_thread', $threadId, 'Client sent a secure portal message.');
            $this->notifications->notifyStaff(
                'client.message.sent', (int) $access['client_id'], 'message_thread', $threadId,
                'New client message', 'A client sent a secure portal message.', 'client-message:' . $messageId,
            );
            $database->commit();
            return ['thread_id' => $threadId, 'message_id' => $messageId];
        } catch (Throwable $error) {
            if ($database->inTransaction()) $database->rollBack();
            throw $error;
        }
    }

    public function archiveThread(array $access, array $user, string $threadId): array
    {
        $this->requireMutationAccess($access, ['primary_contact', 'authorized_user', 'billing_contact', 'document_contact']);
        $database = $this->repository->database();
        $database->beginTransaction();
        try {
            $thread = $this->repository->findThread($threadId, (int) $access['client_id'], true);
            if ($thread === null) $this->notFound();
            if ($thread['status'] === 'archived') throw new AlchemizeRequestException(409, 'THREAD_ARCHIVED', 'This conversation is already archived.');
            $this->repository->archiveThread((int) $thread['id'], (int) $access['client_id']);
            $this->activity($access, $user, 'client.message.archived', 'message_thread', $threadId, 'Client archived a secure portal conversation.');
            $database->commit();
            return ['thread_id' => $threadId, 'status' => 'archived'];
        } catch (Throwable $error) {
            if ($database->inTransaction()) $database->rollBack();
            throw $error;
        }
    }

    public function appointment(array $access, array $user, string $appointmentId, string $action, array $payload): array
    {
        $this->requireMutationAccess($access, ['primary_contact', 'authorized_user']);
        $database = $this->repository->database();
        $database->beginTransaction();
        try {
            $appointment = $this->repository->findAppointment($appointmentId, (int) $access['client_id'], true);
            if ($appointment === null) $this->notFound();
            if ($action === 'confirm') {
                if (!in_array($appointment['status'], ['requested', 'scheduled'], true)) throw new AlchemizeRequestException(409, 'APPOINTMENT_STATE_INVALID', 'This appointment cannot be confirmed in its current state.');
                $this->repository->updateAppointment((int) $appointment['id'], ['status' => 'confirmed']);
                $event = 'client.appointment.confirmed';
            } elseif (in_array($action, ['request-reschedule', 'request-cancellation'], true)) {
                if (in_array($appointment['status'], ['completed', 'cancelled'], true) || $this->repository->hasPendingAppointmentRequest((int) $appointment['id'])) {
                    throw new AlchemizeRequestException(409, 'APPOINTMENT_STATE_INVALID', 'This appointment cannot accept another change request.');
                }
                $type = $action === 'request-reschedule' ? 'reschedule' : 'cancellation';
                $requestedAt = $type === 'reschedule' ? $this->requiredDateTime($payload['requested_at'] ?? null) : null;
                $requestId = alchemize_uuid_v4();
                $this->repository->createAppointmentRequest([
                    'public_id' => $requestId, 'appointment_id' => $appointment['id'], 'client_id' => $access['client_id'],
                    'requested_by_user_id' => $user['user_id'], 'request_type' => $type,
                    'requested_at_value' => $requestedAt, 'reason' => $this->optionalText($payload['reason'] ?? null, 2000),
                ]);
                $this->audit($user, 'client.appointment.' . $type . '_requested', 'appointment', $appointmentId, 'Client requested an appointment change for staff review.');
                $event = 'client.appointment.' . $type . '_requested';
            } elseif ($action === 'acknowledge') {
                $this->acknowledgeEntity($access, $user, 'appointment', $appointmentId, 'Appointment instructions acknowledged.');
                $event = 'client.appointment.acknowledged';
            } else $this->notFound();
            if ($action !== 'acknowledge') {
                $this->activity($access, $user, $event, 'appointment', $appointmentId, 'Client action for appointment: ' . $appointment['appointment_type'], $appointment['engagement_id']);
                $this->notifications->notifyStaff(
                    $event, (int) $access['client_id'], 'appointment', $appointmentId,
                    'Client appointment update', $appointment['appointment_type'],
                    'appointment-action:' . $appointmentId . ':' . $action,
                );
            }
            $database->commit();
            $sync = $action === 'confirm' && $this->integrations !== null
                ? $this->integrations->synchronizeAppointment((int) $appointment['id']) : ['status' => 'pending'];
            return ['id' => $appointmentId, 'action' => $action, 'status' => $action === 'confirm' ? 'confirmed' : $appointment['status'], 'calendar_sync_status' => $sync['status']];
        } catch (Throwable $error) {
            if ($database->inTransaction()) $database->rollBack();
            throw $error;
        }
    }

    public function profile(array $access, array $user, array $payload): array
    {
        $this->requireMutationAccess($access, ['primary_contact', 'authorized_user']);
        $directAllowed = ['primary_phone', 'primary_email', 'preferred_contact_method', 'language_preference'];
        $reviewRequired = ['legal_name', 'business_legal_name', 'dba_name', 'entity_type', 'formation_state', 'formation_date'];
        $direct = [];
        $requests = [];
        foreach ($payload as $field => $value) {
            if (in_array($field, $directAllowed, true)) {
                $normalized = $this->profileValue($field, $value);
                $direct[$field] = $normalized;
            } elseif (in_array($field, $reviewRequired, true)) {
                if ($field !== 'legal_name' && (string) $access['client_type'] !== 'business') {
                    throw new AlchemizeRequestException(422, 'PROFILE_FIELD_NOT_EDITABLE', 'This business profile field is not available for the client account.');
                }
                $proposed = $this->optionalText($value, 254);
                if ($this->repository->hasPendingProfileChange((int) $access['client_id'], $field)) {
                    throw new AlchemizeRequestException(409, 'PROFILE_CHANGE_PENDING', 'A change for this field is already awaiting review.');
                }
                $requests[] = ['field' => $field, 'old' => $this->repository->currentProfileField((int) $access['client_id'], $field), 'proposed' => $proposed];
            } else {
                throw new AlchemizeRequestException(422, 'PROFILE_FIELD_NOT_EDITABLE', 'One or more profile fields cannot be changed through the portal.');
            }
        }
        if ($direct === [] && $requests === []) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Provide at least one profile change.');
        $database = $this->repository->database();
        $database->beginTransaction();
        try {
            if ($direct !== []) {
                $this->repository->updateDirectProfile((int) $access['client_id'], $direct);
                $this->activity($access, $user, 'client.profile.updated', 'client', $access['client_public_id'], 'Client updated permitted contact preferences.');
                $this->audit($user, 'client.profile.updated', 'client', $access['client_public_id'], 'Client updated directly editable profile fields.');
            }
            foreach ($requests as $request) {
                $id = alchemize_uuid_v4();
                $this->repository->createProfileChange([
                    'public_id' => $id, 'client_id' => $access['client_id'], 'requested_by_user_id' => $user['user_id'],
                    'field_name' => $request['field'], 'old_value' => $request['old'], 'proposed_value' => $request['proposed'],
                ]);
                $this->activity($access, $user, 'client.profile.change_requested', 'profile_change', $id, 'Client submitted a profile change for administrative review.');
                $this->audit($user, 'client.profile.change_requested', 'profile_change', $id, 'Client proposed a review-required profile change.');
            }
            $database->commit();
            return ['updated_fields' => array_keys($direct), 'review_requests' => array_column($requests, 'field')];
        } catch (Throwable $error) {
            if ($database->inTransaction()) $database->rollBack();
            throw $error;
        }
    }

    public function acknowledge(array $access, array $user, string $entityType, string $entityId): array
    {
        $this->requireMutationAccess($access, ['primary_contact', 'authorized_user', 'billing_contact', 'document_contact']);
        $allowed = ['engagement', 'invoice'];
        if (!in_array($entityType, $allowed, true)) $this->notFound();
        if (!$this->repository->entityBelongsToClient($entityType, $entityId, (int) $access['client_id'])) $this->notFound();
        $created = $this->acknowledgeEntity($access, $user, $entityType, $entityId, ucfirst($entityType) . ' acknowledged.');
        return ['acknowledged' => true, 'created' => $created];
    }

    public function dismissOnboarding(array $access): array
    {
        $this->repository->updateDirectProfile((int) $access['client_id'], ['portal_onboarding_dismissed_at' => date('Y-m-d H:i:s.u')]);
        return ['dismissed' => true];
    }

    public function requestAuthorizedUser(array $access, array $user, array $payload): array
    {
        if ((string) ($access['access_role'] ?? '') !== 'primary_contact') {
            throw new AlchemizeRequestException(403, 'ACCESS_REQUEST_NOT_PERMITTED', 'Only the primary contact may request portal access changes.');
        }
        $name = trim((string) ($payload['name'] ?? ''));
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $role = (string) ($payload['access_role'] ?? 'authorized_user');
        $roles = ['primary_contact', 'authorized_user', 'billing_contact', 'document_contact', 'read_only'];
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !in_array($role, $roles, true)) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Name, valid email, and access type are required.');
        }
        if ($this->repository->hasPendingAuthorizedUserRequest((int) $access['client_id'], $email)) {
            throw new AlchemizeRequestException(409, 'ACCESS_REQUEST_PENDING', 'A portal access request for this email is already pending.');
        }
        $this->repository->createAuthorizedUserRequest([
            'public_id' => alchemize_uuid_v4(), 'client_id' => (int) $access['client_id'],
            'requested_by_user_id' => (int) $user['user_id'], 'name' => $name,
            'email' => $email, 'requested_access_role' => $role,
        ]);
        return ['requested' => true];
    }

    private function acknowledgeEntity(array $access, array $user, string $type, string $id, string $summary): bool
    {
        $created = $this->repository->acknowledge([
            'public_id' => alchemize_uuid_v4(), 'client_id' => $access['client_id'], 'user_id' => $user['user_id'],
            'entity_type' => $type, 'entity_id' => $id,
        ]);
        if ($created) $this->activity($access, $user, 'client.acknowledged', $type, $id, $summary);
        return $created;
    }

    private function activity(array $access, array $user, string $eventType, string $entityType, string $entityId, string $summary, mixed $engagementId = null): void
    {
        $this->activities->create([
            'public_id' => alchemize_uuid_v4(), 'event_type' => $eventType, 'actor_type' => 'client',
            'actor_user_id' => $user['user_id'], 'entity_type' => $entityType, 'entity_id' => $entityId,
            'client_id' => $access['client_id'], 'engagement_id' => $engagementId, 'summary' => $summary, 'visibility' => 'both',
        ]);
    }

    private function audit(array $user, string $eventType, string $entityType, string $entityId, string $summary): void
    {
        $this->audit->create([
            'public_id' => alchemize_uuid_v4(), 'actor_user_id' => $user['user_id'], 'event_type' => $eventType,
            'entity_type' => $entityType, 'entity_id' => $entityId, 'action_summary' => $summary, 'request_metadata' => null,
        ]);
    }

    private function requireMutationAccess(array $access, array $roles): void
    {
        if (!in_array((string) $access['access_role'], $roles, true)) {
            throw new AlchemizeRequestException(403, 'PORTAL_ACTION_FORBIDDEN', 'Your portal access does not permit this action.');
        }
    }

    private function requiredText(mixed $value, int $max, string $label): string
    {
        $text = trim((string) $value);
        if ($text === '' || alchemize_text_length($text) > $max) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', "{$label} is required and must be {$max} characters or fewer.");
        return $text;
    }

    private function optionalText(mixed $value, int $max): ?string
    {
        $text = trim((string) ($value ?? ''));
        if ($text === '') return null;
        if (alchemize_text_length($text) > $max) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', "Text must be {$max} characters or fewer.");
        return $text;
    }

    private function profileValue(string $field, mixed $value): ?string
    {
        $text = $this->optionalText($value, 254);
        if ($field === 'primary_email' && $text !== null && !filter_var($text, FILTER_VALIDATE_EMAIL)) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Enter a valid email address.');
        if ($field === 'preferred_contact_method' && !in_array($text, ['email', 'phone', 'either'], true)) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a valid contact preference.');
        if ($field === 'language_preference' && !in_array($text, ['en', 'es'], true)) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select English or EspaÃ±ol.');
        return $text;
    }

    private function requiredDateTime(mixed $value): string
    {
        $text = trim((string) $value);
        $timestamp = strtotime($text);
        if ($text === '' || $timestamp === false || $timestamp <= time()) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Choose a valid future date and time.');
        return date('Y-m-d H:i:s', $timestamp);
    }

    private function relatedType(mixed $value): ?string
    {
        $text = trim((string) ($value ?? ''));
        if ($text === '') return null;
        if (!in_array($text, ['engagement', 'task', 'document', 'appointment', 'invoice'], true)) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'The related record type is invalid.');
        return $text;
    }

    private function notFound(): never
    {
        throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested portal record was not found.');
    }
}
