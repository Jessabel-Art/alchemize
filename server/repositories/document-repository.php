<?php

declare(strict_types=1);

final class AlchemizeDocumentRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listAll(): array
    {
        $statement = $this->database->query('SELECT * FROM documents_metadata ORDER BY created_at DESC');
        return $statement->fetchAll();
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO documents_metadata (
                public_id, client_id, engagement_id, service_id, document_name, document_type,
                status, visibility, requested_date, due_date, client_instructions, received_date, reviewed_date, owner_user_id,
                internal_notes, storage_key, mime_type
            ) VALUES (
                :public_id, :client_id, :engagement_id, :service_id, :document_name, :document_type,
                :status, :visibility, :requested_date, :due_date, :client_instructions, :received_date, :reviewed_date, :owner_user_id,
                :internal_notes, :storage_key, :mime_type
            )'
        );
        $statement->execute($row);
        return (int) $this->database->lastInsertId();
    }

    public function update(int $id, array $values): void
    {
        if ($values === []) {
            return;
        }
        $fields = [];
        foreach (array_keys($values) as $field) {
            $fields[] = sprintf('%s = :%s', $field, $field);
        }
        $sql = 'UPDATE documents_metadata SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $statement = $this->database->prepare($sql);
        $values['id'] = $id;
        $statement->execute($values);
    }
}
