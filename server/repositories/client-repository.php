<?php

declare(strict_types=1);

final class AlchemizeClientRepository
{
    public function __construct(private readonly PDO $database) {}

    public function getDatabase(): PDO
    {
        return $this->database;
    }

    public function listAll(): array
    {
        $statement = $this->database->query(
            'SELECT * FROM clients ORDER BY created_at DESC'
        );
        return $statement->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM clients WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO clients (
                public_id, client_type, display_name, legal_name, preferred_name, primary_email,
                primary_phone, preferred_contact_method, language_preference, status, portal_status, source, origin_lead_id
            ) VALUES (
                :public_id, :client_type, :display_name, :legal_name, :preferred_name, :primary_email,
                :primary_phone, :preferred_contact_method, :language_preference, :status, :portal_status, :source, :origin_lead_id
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
        $sql = 'UPDATE clients SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $statement = $this->database->prepare($sql);
        $values['id'] = $id;
        $statement->execute($values);
    }
}
