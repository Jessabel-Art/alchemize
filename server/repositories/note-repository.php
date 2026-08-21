<?php

declare(strict_types=1);

final class AlchemizeNoteRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listByEntity(string $entityType, string $entityId): array
    {
        $statement = $this->database->prepare(
            'SELECT * FROM notes WHERE entity_type = :entity_type AND entity_id = :entity_id ORDER BY created_at DESC'
        );
        $statement->execute(['entity_type' => $entityType, 'entity_id' => $entityId]);
        return $statement->fetchAll();
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO notes (public_id, entity_type, entity_id, client_id, note_category, note_body, author_user_id)
             VALUES (:public_id, :entity_type, :entity_id, :client_id, :note_category, :note_body, :author_user_id)'
        );
        $statement->execute($row);
        return (int) $this->database->lastInsertId();
    }
}
