<?php

declare(strict_types=1);

final class AlchemizePortalAdminRepository
{
    public function __construct(private readonly PDO $database) {}

    public function database(): PDO { return $this->database; }

    public function listThreads(): array
    {
        return $this->database->query(
            "SELECT mt.public_id AS id, c.public_id AS client_id, mt.subject, mt.status, mt.client_action_required,
                    mt.related_entity_type, mt.related_entity_id, mt.last_message_at,
                    c.display_name AS client_name, c.language_preference,
                    SUM(CASE WHEN m.sender_type = 'client' AND m.read_by_admin_at IS NULL THEN 1 ELSE 0 END) AS unread_count,
                    (SELECT latest.message_body FROM messages latest WHERE latest.thread_id = mt.id
                     ORDER BY latest.created_at DESC, latest.id DESC LIMIT 1) AS latest_message
             FROM message_threads mt
             INNER JOIN clients c ON c.id = mt.client_id
             LEFT JOIN messages m ON m.thread_id = mt.id
             GROUP BY mt.id, mt.public_id, c.public_id, mt.subject, mt.status, mt.client_action_required,
                      mt.related_entity_type, mt.related_entity_id, mt.last_message_at,
                      c.display_name, c.language_preference
             ORDER BY mt.status = 'archived', mt.last_message_at DESC"
        )->fetchAll();
    }

    public function getThread(string $publicId, bool $markRead = false): ?array
    {
        $thread = $this->one(
            'SELECT mt.public_id AS id, mt.client_id, mt.subject, mt.status, mt.client_action_required,
                    mt.related_entity_type, mt.related_entity_id, mt.last_message_at,
                    c.display_name AS client_name, c.language_preference
             FROM message_threads mt INNER JOIN clients c ON c.id = mt.client_id
             WHERE mt.public_id = :id LIMIT 1',
            ['id' => $publicId],
        );
        if ($thread === null) return null;
        if ($markRead) $this->markClientMessagesRead($publicId);
        $statement = $this->database->prepare(
            'SELECT m.public_id AS id, m.sender_type, m.message_body, m.created_at, m.edited_at,
                    u.display_name AS sender_name
             FROM messages m INNER JOIN users u ON u.id = m.sender_user_id
             INNER JOIN message_threads mt ON mt.id = m.thread_id
             WHERE mt.public_id = :id ORDER BY m.created_at, m.id'
        );
        $statement->execute(['id' => $publicId]);
        return ['thread' => $thread, 'messages' => $statement->fetchAll()];
    }

    public function updateThreadState(string $publicId, string $status, bool $clientActionRequired): ?array
    {
        $thread = $this->one('SELECT id, client_id FROM message_threads WHERE public_id = :id LIMIT 1', ['id' => $publicId]);
        if ($thread === null) return null;
        $statement = $this->database->prepare(
            'UPDATE message_threads SET status = :status, client_action_required = :required,
                    client_action_required_at = CASE WHEN :required_check = 1 THEN CURRENT_TIMESTAMP(6) ELSE NULL END,
                    archived_at = CASE WHEN :archive_status = \'archived\' THEN CURRENT_TIMESTAMP(6) ELSE NULL END
             WHERE id = :id'
        );
        $statement->execute([
            'status' => $status, 'required' => $clientActionRequired ? 1 : 0,
            'required_check' => $clientActionRequired ? 1 : 0, 'archive_status' => $status,
            'id' => $thread['id'],
        ]);
        return $thread;
    }

    public function linkThread(string $publicId, string $type, string $relatedPublicId): ?array
    {
        $thread = $this->one('SELECT id, client_id FROM message_threads WHERE public_id = :id LIMIT 1', ['id' => $publicId]);
        if ($thread === null) return null;
        $table = [
            'engagement' => 'engagements', 'task' => 'tasks', 'document' => 'documents_metadata',
            'appointment' => 'appointments', 'invoice' => 'invoices',
        ][$type] ?? null;
        if ($type === 'service') {
            $related = $this->one(
                'SELECT s.id FROM services s INNER JOIN engagement_services es ON es.service_id = s.id
                 INNER JOIN engagements e ON e.id = es.engagement_id
                 WHERE s.public_id = :related_id AND e.client_id = :client_id LIMIT 1',
                ['related_id' => $relatedPublicId, 'client_id' => $thread['client_id']],
            );
        } elseif ($table !== null) {
            $related = $this->one(
                "SELECT id FROM {$table} WHERE public_id = :related_id AND client_id = :client_id LIMIT 1",
                ['related_id' => $relatedPublicId, 'client_id' => $thread['client_id']],
            );
        } else {
            $related = null;
        }
        if ($related === null) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The related client record was not found.');
        $columns = ['service_id', 'engagement_id', 'task_id', 'document_id', 'appointment_id', 'invoice_id'];
        $values = array_fill_keys($columns, null);
        $values[$type . '_id'] = (int) $related['id'];
        $values['related_entity_type'] = $type;
        $values['related_entity_id'] = $relatedPublicId;
        $this->update('message_threads', (int) $thread['id'], $values);
        return $thread;
    }

    public function attention(): array
    {
        $sql = "
            SELECT * FROM (
                SELECT tca.public_id AS id, 'task_action' AS kind, c.display_name AS client_name,
                       t.title AS title, tca.action_type AS status, tca.response_text AS detail, tca.created_at
                FROM task_client_actions tca
                INNER JOIN tasks t ON t.id = tca.task_id
                INNER JOIN clients c ON c.id = tca.client_id
                WHERE tca.action_type IN ('completed','responded') AND tca.reviewed_at IS NULL
                UNION ALL
                SELECT ds.public_id, 'document_submission', c.display_name, d.document_name,
                       ds.status, ds.original_filename, ds.submitted_at
                FROM document_submissions ds
                INNER JOIN documents_metadata d ON d.id = ds.document_id
                INNER JOIN clients c ON c.id = ds.client_id
                WHERE ds.status IN ('received','under_review')
                UNION ALL
                SELECT mt.public_id, 'message', c.display_name, mt.subject, mt.status,
                       MAX(m.message_body), MAX(m.created_at)
                FROM message_threads mt
                INNER JOIN messages m ON m.thread_id = mt.id
                INNER JOIN clients c ON c.id = mt.client_id
                WHERE m.sender_type = 'client' AND m.read_by_admin_at IS NULL
                GROUP BY mt.id, mt.public_id, c.display_name, mt.subject, mt.status
                UNION ALL
                SELECT acr.public_id, 'appointment_request', c.display_name, a.appointment_type,
                       acr.request_type, acr.reason, acr.created_at
                FROM appointment_change_requests acr
                INNER JOIN appointments a ON a.id = acr.appointment_id
                INNER JOIN clients c ON c.id = acr.client_id
                WHERE acr.status = 'pending'
                UNION ALL
                SELECT pcr.public_id, 'profile_change', c.display_name, pcr.field_name,
                       pcr.status, pcr.proposed_value, pcr.created_at
                FROM profile_change_requests pcr
                INNER JOIN clients c ON c.id = pcr.client_id
                WHERE pcr.status = 'pending'
                UNION ALL
                SELECT aur.public_id, 'access_request', c.display_name, aur.name,
                       aur.requested_access_role, aur.email, aur.created_at
                FROM authorized_user_requests aur
                INNER JOIN clients c ON c.id = aur.client_id
                WHERE aur.status = 'pending'
            ) portal_attention
            ORDER BY created_at DESC LIMIT 50";
        return $this->database->query($sql)->fetchAll();
    }

    public function findAppointmentRequest(string $publicId, bool $lock): ?array
    {
        return $this->one(
            'SELECT acr.*, a.public_id AS appointment_public_id, a.appointment_type, a.scheduled_at,
                    a.status AS appointment_status, a.engagement_id
             FROM appointment_change_requests acr INNER JOIN appointments a ON a.id = acr.appointment_id
             WHERE acr.public_id = :id LIMIT 1' . ($lock ? ' FOR UPDATE' : ''), ['id' => $publicId],
        );
    }

    public function resolveAppointmentRequest(int $id, int $appointmentId, string $decision, int $actorId, ?string $note, ?string $scheduledAt, string $requestType): void
    {
        $statement = $this->database->prepare(
            'UPDATE appointment_change_requests SET status = :status, resolved_by_user_id = :actor,
                    resolution_note = :note, resolved_at = CURRENT_TIMESTAMP(6) WHERE id = :id AND status = \'pending\''
        );
        $statement->execute(['status' => $decision, 'actor' => $actorId, 'note' => $note, 'id' => $id]);
        if ($decision === 'approved') {
            $values = $requestType === 'cancellation'
                ? ['status' => 'cancelled', 'cancelled_at' => date('Y-m-d H:i:s.u')]
                : ['status' => 'confirmed', 'scheduled_at' => $scheduledAt];
            $this->update('appointments', $appointmentId, $values);
        }
    }

    public function findProfileChange(string $publicId, bool $lock): ?array
    {
        return $this->one('SELECT * FROM profile_change_requests WHERE public_id = :id LIMIT 1' . ($lock ? ' FOR UPDATE' : ''), ['id' => $publicId]);
    }

    public function findAccessRequest(string $publicId, bool $lock): ?array
    {
        return $this->one(
            'SELECT aur.*, CASE WHEN r.id IS NOT NULL THEN u.id ELSE NULL END AS target_user_id
             FROM authorized_user_requests aur
             LEFT JOIN users u ON u.email = aur.email AND u.status = \'active\'
             LEFT JOIN roles r ON r.id = u.role_id AND r.slug IN (\'client\', \'business-authorized-user\')
             WHERE aur.public_id = :id LIMIT 1' . ($lock ? ' FOR UPDATE' : ''),
            ['id' => $publicId],
        );
    }

    public function resolveAccessRequest(array $request, string $decision, int $actorId, ?string $note): void
    {
        if ($decision === 'approved' && empty($request['target_user_id'])) {
            throw new AlchemizeRequestException(409, 'PORTAL_ACCOUNT_REQUIRED', 'Create an active client portal account for this email before approving access.');
        }
        $statement = $this->database->prepare(
            'UPDATE authorized_user_requests SET status = :status, resolution_note = :note,
                    resolved_by_user_id = :actor, resolved_at = CURRENT_TIMESTAMP(6)
             WHERE id = :id AND status = \'pending\''
        );
        $statement->execute(['status' => $decision, 'note' => $note, 'actor' => $actorId, 'id' => $request['id']]);
        if ($decision !== 'approved') return;
        $statement = $this->database->prepare(
            'INSERT INTO client_access_grants
                (public_id, user_id, client_id, access_role, status, is_default, granted_by_user_id, effective_at)
             VALUES (:public_id, :user_id, :client_id, :access_role, \'active\', 0, :actor, CURRENT_TIMESTAMP(6))
             ON DUPLICATE KEY UPDATE access_role = VALUES(access_role), status = \'active\',
                 granted_by_user_id = VALUES(granted_by_user_id), effective_at = CURRENT_TIMESTAMP(6), expires_at = NULL'
        );
        $statement->execute([
            'public_id' => alchemize_uuid_v4(), 'user_id' => $request['target_user_id'],
            'client_id' => $request['client_id'], 'access_role' => $request['requested_access_role'], 'actor' => $actorId,
        ]);
    }

    public function resolveProfileChange(array $request, string $decision, int $actorId, ?string $note): void
    {
        $statement = $this->database->prepare(
            'UPDATE profile_change_requests SET status = :status, resolved_by_user_id = :actor,
                    resolution_note = :note, resolved_at = CURRENT_TIMESTAMP(6) WHERE id = :id AND status = \'pending\''
        );
        $statement->execute(['status' => $decision, 'actor' => $actorId, 'note' => $note, 'id' => $request['id']]);
        if ($decision !== 'approved') return;
        $field = (string) $request['field_name'];
        if ($field === 'legal_name') {
            $this->update('clients', (int) $request['client_id'], ['legal_name' => $request['proposed_value']]);
            return;
        }
        $column = $field === 'business_legal_name' ? 'legal_name' : $field;
        $allowed = ['legal_name', 'dba_name', 'entity_type', 'formation_state', 'formation_date'];
        if (!in_array($column, $allowed, true)) throw new RuntimeException('Unsupported profile field.');
        $statement = $this->database->prepare("UPDATE business_profiles SET {$column} = :value WHERE client_id = :client_id");
        $statement->execute(['value' => $request['proposed_value'], 'client_id' => $request['client_id']]);
    }

    public function findSubmission(string $publicId, bool $lock): ?array
    {
        return $this->one(
            'SELECT ds.*, d.public_id AS document_public_id, d.document_name, d.engagement_id
             FROM document_submissions ds INNER JOIN documents_metadata d ON d.id = ds.document_id
             WHERE ds.public_id = :id LIMIT 1' . ($lock ? ' FOR UPDATE' : ''), ['id' => $publicId],
        );
    }

    public function listDocumentVersions(string $documentPublicId): array
    {
        $statement = $this->database->prepare(
            'SELECT ds.public_id AS id, ds.version_number, ds.original_filename, ds.mime_type,
                    ds.file_size_bytes, ds.status, ds.submitted_at, ds.reviewed_at, ds.archived_at,
                    u.display_name AS uploaded_by
             FROM documents_metadata d
             INNER JOIN document_submissions ds ON ds.document_id = d.id
             INNER JOIN users u ON u.id = ds.submitted_by_user_id
             WHERE d.public_id = :document_id
             ORDER BY ds.version_number DESC'
        );
        $statement->execute(['document_id' => $documentPublicId]);
        return $statement->fetchAll();
    }

    public function reviewSubmission(array $submission, string $decision, int $actorId, ?string $clientNote, ?string $internalNote): void
    {
        $status = $decision === 'accept' ? 'accepted' : 'replacement_requested';
        $statement = $this->database->prepare(
            'UPDATE document_submissions SET status = :status, client_visible_review_note = :client_note,
                    internal_review_notes = :internal_note,
                    reviewed_at = CURRENT_TIMESTAMP(6), reviewed_by_user_id = :actor
             WHERE id = :id AND status IN (\'received\', \'under_review\')'
        );
        $statement->execute(['status' => $status, 'client_note' => $clientNote, 'internal_note' => $internalNote, 'actor' => $actorId, 'id' => $submission['id']]);
        $this->update('documents_metadata', (int) $submission['document_id'], [
            'status' => $status, 'reviewed_date' => date('Y-m-d'),
        ]);
    }

    public function markClientMessagesRead(string $threadPublicId): void
    {
        $thread = $this->one('SELECT id FROM message_threads WHERE public_id = :id LIMIT 1', ['id' => $threadPublicId]);
        if ($thread === null) return;
        $statement = $this->database->prepare(
            'UPDATE messages SET read_by_admin_at = CURRENT_TIMESTAMP(6)
             WHERE thread_id = :thread_id AND sender_type = \'client\' AND read_by_admin_at IS NULL'
        );
        $statement->execute(['thread_id' => $thread['id']]);
    }

    public function replyToThread(string $threadPublicId, int $actorId, string $body): ?array
    {
        $thread = $this->one(
            'SELECT id, client_id, status FROM message_threads WHERE public_id = :id LIMIT 1 FOR UPDATE',
            ['id' => $threadPublicId],
        );
        if ($thread === null) return null;
        if ($thread['status'] === 'archived') throw new AlchemizeRequestException(409, 'THREAD_ARCHIVED', 'Archived conversations cannot receive new messages.');
        $statement = $this->database->prepare(
            'INSERT INTO messages
                (public_id, thread_id, client_id, sender_user_id, sender_type, message_body, read_by_admin_at)
             VALUES (:public_id, :thread_id, :client_id, :sender_user_id, \'staff\', :message_body, CURRENT_TIMESTAMP(6))'
        );
        $statement->execute([
            'public_id' => alchemize_uuid_v4(), 'thread_id' => $thread['id'], 'client_id' => $thread['client_id'],
            'sender_user_id' => $actorId, 'message_body' => $body,
        ]);
        $statement = $this->database->prepare(
            'UPDATE message_threads SET status = \'waiting_on_client\', client_action_required = 1,
                    client_action_required_at = CURRENT_TIMESTAMP(6), last_message_at = CURRENT_TIMESTAMP(6) WHERE id = :id'
        );
        $statement->execute(['id' => $thread['id']]);
        $this->markClientMessagesRead($threadPublicId);
        return $thread;
    }

    public function reviewTaskAction(string $publicId, int $actorId): ?array
    {
        $row = $this->one(
            'SELECT tca.id, tca.client_id, t.public_id AS task_public_id, t.engagement_id
             FROM task_client_actions tca INNER JOIN tasks t ON t.id = tca.task_id
             WHERE tca.public_id = :id AND tca.reviewed_at IS NULL LIMIT 1 FOR UPDATE', ['id' => $publicId],
        );
        if ($row === null) return null;
        $statement = $this->database->prepare(
            'UPDATE task_client_actions SET reviewed_at = CURRENT_TIMESTAMP(6), reviewed_by_user_id = :actor WHERE id = :id'
        );
        $statement->execute(['actor' => $actorId, 'id' => $row['id']]);
        return $row;
    }

    private function one(string $sql, array $parameters): ?array
    {
        $statement = $this->database->prepare($sql); $statement->execute($parameters); $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    private function update(string $table, int $id, array $values): void
    {
        $fields = array_map(static fn (string $field): string => "{$field} = :{$field}", array_keys($values));
        $statement = $this->database->prepare("UPDATE {$table} SET " . implode(', ', $fields) . ' WHERE id = :id');
        $values['id'] = $id; $statement->execute($values);
    }
}
