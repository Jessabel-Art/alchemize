<?php

declare(strict_types=1);

final class AlchemizeLeadRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listAll(): array
    {
        $statement = $this->database->query(
            'SELECT l.*
             FROM leads l
             ORDER BY l.created_at DESC'
        );
        return $statement->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM leads WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $lead = $statement->fetch();
        return is_array($lead) ? $lead : null;
    }

    public function findByIdForUpdate(int $id): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM leads WHERE id = :id LIMIT 1 FOR UPDATE');
        $statement->execute(['id' => $id]);
        $lead = $statement->fetch();
        return is_array($lead) ? $lead : null;
    }

    public function create(array $lead): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO leads
                (public_id, full_name, email, phone, audience, service_key, message, preferred_contact, status, source)
             VALUES
                (:public_id, :full_name, :email, :phone, :audience, :service_key, :message, :preferred_contact, :status, :source)',
        );
        $statement->execute($lead);
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

        $sql = 'UPDATE leads SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $statement = $this->database->prepare($sql);
        $values['id'] = $id;
        $statement->execute($values);
    }

    public function updateStatus(int $id, string $status): void
    {
        $statement = $this->database->prepare('UPDATE leads SET status = :status WHERE id = :id');
        $statement->execute(['status' => $status, 'id' => $id]);
    }
}