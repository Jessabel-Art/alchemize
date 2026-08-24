<?php

declare(strict_types=1);

final class AlchemizePortalActionRepository
{
    public function __construct(private readonly PDO $database) {}

    public function database(): PDO
    {
        return $this->database;
    }

    public function findTask(string $publicId, int $clientId, bool $lock = false): ?array
    {
        return $this->one(
            'SELECT id, public_id, client_id, engagement_id, title, status, visibility, completed_at
             FROM tasks WHERE public_id = :public_id AND client_id = :client_id
               AND visibility IN (\'client\', \'both\') AND archived_at IS NULL LIMIT 1' . ($lock ? ' FOR UPDATE' : ''),
            ['public_id' => $publicId, 'client_id' => $clientId],
        );
    }

    public function updateTask(int $id, array $values): void
    {
        $this->update('tasks', $id, $values);
    }

    public function createTaskAction(array $row): void
    {
        $this->insert(
            'INSERT INTO task_client_actions
                (public_id, task_id, client_id, actor_user_id, action_type, response_text)
             VALUES (:public_id, :task_id, :client_id, :actor_user_id, :action_type, :response_text)',
            $row,
        );
    }

    public function findDocument(string $publicId, int $clientId, bool $lock = false): ?array
    {
        return $this->one(
            'SELECT id, public_id, client_id, engagement_id, document_name, status, visibility
             FROM documents_metadata WHERE public_id = :public_id AND client_id = :client_id
               AND visibility IN (\'client\', \'shared\') AND archived_at IS NULL LIMIT 1' . ($lock ? ' FOR UPDATE' : ''),
            ['public_id' => $publicId, 'client_id' => $clientId],
        );
    }

    public function createDocumentSubmission(array $row): void
    {
        $this->insert(
            'INSERT INTO document_submissions
                (public_id, document_id, client_id, version_number, submitted_by_user_id, original_filename,
                 storage_key, mime_type, file_extension, file_size_bytes, sha256, client_comment)
             VALUES
                (:public_id, :document_id, :client_id, :version_number, :submitted_by_user_id, :original_filename,
                 :storage_key, :mime_type, :file_extension, :file_size_bytes, :sha256, :client_comment)',
            $row,
        );
    }

    public function nextDocumentVersion(int $documentId): int
    {
        $statement = $this->database->prepare(
            'SELECT COALESCE(MAX(version_number), 0) + 1 FROM document_submissions WHERE document_id = :document_id'
        );
        $statement->execute(['document_id' => $documentId]);
        return (int) $statement->fetchColumn();
    }

    public function findClientDownload(string $documentPublicId, int $clientId): ?array
    {
        return $this->one(
            'SELECT ds.public_id AS submission_id, ds.storage_key, ds.original_filename,
                    ds.mime_type, ds.file_size_bytes, ds.sha256, ds.version_number,
                    d.public_id AS document_id, d.document_name, d.visibility
             FROM documents_metadata d
             INNER JOIN document_submissions ds ON ds.document_id = d.id AND ds.client_id = d.client_id
             WHERE d.public_id = :document_id AND d.client_id = :client_id
               AND d.visibility IN (\'client\', \'shared\') AND d.archived_at IS NULL
               AND ds.archived_at IS NULL
             ORDER BY ds.version_number DESC LIMIT 1',
            ['document_id' => $documentPublicId, 'client_id' => $clientId],
        );
    }

    public function updateDocument(int $id, array $values): void
    {
        $this->update('documents_metadata', $id, $values);
    }

    public function listThreads(int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT mt.public_id AS id, mt.subject, mt.related_entity_type, mt.related_entity_id,
                    mt.status, mt.client_action_required, mt.last_message_at,
                    SUM(CASE WHEN m.sender_type = \'staff\' AND m.read_by_client_at IS NULL THEN 1 ELSE 0 END) AS unread_count,
                    (SELECT latest.message_body FROM messages latest
                     WHERE latest.thread_id = mt.id ORDER BY latest.created_at DESC, latest.id DESC LIMIT 1) AS latest_message
             FROM message_threads mt
             LEFT JOIN messages m ON m.thread_id = mt.id
             WHERE mt.client_id = :client_id
             GROUP BY mt.id, mt.public_id, mt.subject, mt.related_entity_type, mt.related_entity_id,
                      mt.status, mt.client_action_required, mt.last_message_at
             ORDER BY mt.status = \'archived\', mt.last_message_at DESC'
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function findThread(string $publicId, int $clientId, bool $lock = false): ?array
    {
        return $this->one(
            'SELECT id, public_id, client_id, subject, status, related_entity_type, related_entity_id FROM message_threads
             WHERE public_id = :public_id AND client_id = :client_id LIMIT 1' . ($lock ? ' FOR UPDATE' : ''),
            ['public_id' => $publicId, 'client_id' => $clientId],
        );
    }

    public function listThreadMessages(int $threadId, int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT m.public_id AS id, m.sender_type, m.message_body, m.created_at,
                    u.display_name AS sender_name
             FROM messages m INNER JOIN users u ON u.id = m.sender_user_id
             WHERE m.thread_id = :thread_id AND m.client_id = :client_id
             ORDER BY m.created_at ASC'
        );
        $statement->execute(['thread_id' => $threadId, 'client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function createThread(array $row): int
    {
        $this->insert(
            'INSERT INTO message_threads
                (public_id, client_id, subject, related_entity_type, related_entity_id, created_by_user_id)
             VALUES
                (:public_id, :client_id, :subject, :related_entity_type, :related_entity_id, :created_by_user_id)',
            $row,
        );
        return (int) $this->database->lastInsertId();
    }

    public function createMessage(array $row): void
    {
        $this->insert(
            'INSERT INTO messages
                (public_id, thread_id, client_id, sender_user_id, sender_type, message_body,
                 read_by_client_at, read_by_admin_at)
             VALUES
                (:public_id, :thread_id, :client_id, :sender_user_id, :sender_type, :message_body,
                 :read_by_client_at, :read_by_admin_at)',
            $row,
        );
        $statement = $this->database->prepare(
            'UPDATE message_threads SET status = \'waiting_on_alchemize\', client_action_required = 0,
                    client_action_required_at = NULL, last_message_at = CURRENT_TIMESTAMP(6)
             WHERE id = :id AND client_id = :client_id'
        );
        $statement->execute(['id' => $row['thread_id'], 'client_id' => $row['client_id']]);
    }

    public function markThreadRead(int $threadId, int $clientId): void
    {
        $statement = $this->database->prepare(
            'UPDATE messages SET read_by_client_at = CURRENT_TIMESTAMP(6)
             WHERE thread_id = :thread_id AND client_id = :client_id
               AND sender_type = \'staff\' AND read_by_client_at IS NULL'
        );
        $statement->execute(['thread_id' => $threadId, 'client_id' => $clientId]);
    }

    public function archiveThread(int $threadId, int $clientId): void
    {
        $statement = $this->database->prepare(
            'UPDATE message_threads SET status = \'archived\', archived_at = CURRENT_TIMESTAMP(6) WHERE id = :id AND client_id = :client_id'
        );
        $statement->execute(['id' => $threadId, 'client_id' => $clientId]);
    }

    public function findAppointment(string $publicId, int $clientId, bool $lock = false): ?array
    {
        return $this->one(
            'SELECT id, public_id, client_id, engagement_id, appointment_type, scheduled_at, status, visibility
             FROM appointments WHERE public_id = :public_id AND client_id = :client_id
               AND visibility IN (\'client\', \'both\') LIMIT 1' . ($lock ? ' FOR UPDATE' : ''),
            ['public_id' => $publicId, 'client_id' => $clientId],
        );
    }

    public function hasPendingAppointmentRequest(int $appointmentId): bool
    {
        return $this->one(
            'SELECT id FROM appointment_change_requests WHERE appointment_id = :appointment_id AND status = \'pending\' LIMIT 1',
            ['appointment_id' => $appointmentId],
        ) !== null;
    }

    public function createAppointmentRequest(array $row): void
    {
        $this->insert(
            'INSERT INTO appointment_change_requests
                (public_id, appointment_id, client_id, requested_by_user_id, request_type, requested_at_value, reason)
             VALUES
                (:public_id, :appointment_id, :client_id, :requested_by_user_id, :request_type, :requested_at_value, :reason)',
            $row,
        );
    }

    public function updateAppointment(int $id, array $values): void
    {
        $this->update('appointments', $id, $values);
    }

    public function updateDirectProfile(int $clientId, array $values): void
    {
        $this->update('clients', $clientId, $values);
    }

    public function createAuthorizedUserRequest(array $row): void
    {
        $this->insert(
            'INSERT INTO authorized_user_requests
                (public_id, client_id, requested_by_user_id, name, email, requested_access_role)
             VALUES (:public_id, :client_id, :requested_by_user_id, :name, :email, :requested_access_role)',
            $row,
        );
    }

    public function hasPendingAuthorizedUserRequest(int $clientId, string $email): bool
    {
        return $this->one(
            'SELECT id FROM authorized_user_requests
             WHERE client_id = :client_id AND email = :email AND status = \'pending\' LIMIT 1',
            ['client_id' => $clientId, 'email' => $email],
        ) !== null;
    }

    public function currentProfileField(int $clientId, string $field): ?string
    {
        $clientFields = ['legal_name'];
        $table = in_array($field, $clientFields, true) ? 'clients' : 'business_profiles';
        $column = $field === 'business_legal_name' ? 'legal_name' : $field;
        $statement = $this->database->prepare("SELECT {$column} AS value FROM {$table} WHERE " . ($table === 'clients' ? 'id' : 'client_id') . ' = :client_id LIMIT 1');
        $statement->execute(['client_id' => $clientId]);
        $row = $statement->fetch();
        return is_array($row) && $row['value'] !== null ? (string) $row['value'] : null;
    }

    public function hasPendingProfileChange(int $clientId, string $field): bool
    {
        return $this->one(
            'SELECT id FROM profile_change_requests
             WHERE client_id = :client_id AND field_name = :field_name AND status = \'pending\' LIMIT 1',
            ['client_id' => $clientId, 'field_name' => $field],
        ) !== null;
    }

    public function createProfileChange(array $row): void
    {
        $this->insert(
            'INSERT INTO profile_change_requests
                (public_id, client_id, requested_by_user_id, field_name, old_value, proposed_value)
             VALUES
                (:public_id, :client_id, :requested_by_user_id, :field_name, :old_value, :proposed_value)',
            $row,
        );
    }

    public function acknowledge(array $row): bool
    {
        $statement = $this->database->prepare(
            'INSERT IGNORE INTO record_acknowledgements
                (public_id, client_id, user_id, entity_type, entity_id)
             VALUES (:public_id, :client_id, :user_id, :entity_type, :entity_id)'
        );
        $statement->execute($row);
        return $statement->rowCount() === 1;
    }

    public function entityBelongsToClient(string $entityType, string $publicId, int $clientId): bool
    {
        $tables = ['engagement' => 'engagements', 'invoice' => 'invoices'];
        $table = $tables[$entityType] ?? null;
        if ($table === null) return false;
        $extra = $entityType === 'invoice' ? ' AND issued_at IS NOT NULL AND status NOT IN (\'draft\',\'cancelled\',\'voided\')' : ' AND archived_at IS NULL';
        return $this->one(
            "SELECT id FROM {$table} WHERE public_id = :public_id AND client_id = :client_id{$extra} LIMIT 1",
            ['public_id' => $publicId, 'client_id' => $clientId],
        ) !== null;
    }

    public function relatedEntityBelongsToClient(string $entityType, string $publicId, int $clientId): bool
    {
        $tables = [
            'engagement' => ['engagements', 'archived_at IS NULL'],
            'task' => ['tasks', "visibility IN ('client','both') AND archived_at IS NULL"],
            'document' => ['documents_metadata', "visibility IN ('client','shared') AND archived_at IS NULL"],
            'appointment' => ['appointments', "visibility IN ('client','both')"],
            'invoice' => ['invoices', "issued_at IS NOT NULL AND status NOT IN ('draft','cancelled','voided')"],
        ];
        if (!isset($tables[$entityType])) return false;
        [$table, $rule] = $tables[$entityType];
        return $this->one(
            "SELECT id FROM {$table} WHERE public_id = :public_id AND client_id = :client_id AND {$rule} LIMIT 1",
            ['public_id' => $publicId, 'client_id' => $clientId],
        ) !== null;
    }

    private function one(string $sql, array $parameters): ?array
    {
        $statement = $this->database->prepare($sql);
        $statement->execute($parameters);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    private function insert(string $sql, array $row): void
    {
        $statement = $this->database->prepare($sql);
        $statement->execute($row);
    }

    private function update(string $table, int $id, array $values): void
    {
        if ($values === []) return;
        $fields = array_map(static fn (string $field): string => "{$field} = :{$field}", array_keys($values));
        $statement = $this->database->prepare("UPDATE {$table} SET " . implode(', ', $fields) . ' WHERE id = :id');
        $values['id'] = $id;
        $statement->execute($values);
    }
}
