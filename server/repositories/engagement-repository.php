<?php

declare(strict_types=1);

final class AlchemizeEngagementRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listAll(): array
    {
        $statement = $this->database->query('SELECT * FROM engagements ORDER BY created_at DESC');
        return $statement->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM engagements WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO engagements (
                public_id, engagement_number, client_id, title, description, status,
                start_date, target_date, completion_date, owner_user_id, billing_arrangement,
                scope_notes, pricing_notes
            ) VALUES (
                :public_id, :engagement_number, :client_id, :title, :description, :status,
                :start_date, :target_date, :completion_date, :owner_user_id, :billing_arrangement,
                :scope_notes, :pricing_notes
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
        $sql = 'UPDATE engagements SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $statement = $this->database->prepare($sql);
        $values['id'] = $id;
        $statement->execute($values);
    }
}
