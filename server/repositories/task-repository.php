<?php

declare(strict_types=1);

final class AlchemizeTaskRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listAll(): array
    {
        $statement = $this->database->query('SELECT * FROM tasks ORDER BY due_date ASC, created_at DESC');
        return $statement->fetchAll();
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO tasks (
                public_id, client_id, engagement_id, service_id, title, description,
                owner_user_id, priority, due_date, status, dependency_task_id, internal_notes
            ) VALUES (
                :public_id, :client_id, :engagement_id, :service_id, :title, :description,
                :owner_user_id, :priority, :due_date, :status, :dependency_task_id, :internal_notes
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
        $sql = 'UPDATE tasks SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $statement = $this->database->prepare($sql);
        $values['id'] = $id;
        $statement->execute($values);
    }
}
