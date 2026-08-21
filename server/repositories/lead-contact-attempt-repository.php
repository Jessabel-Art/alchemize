<?php

declare(strict_types=1);

final class AlchemizeLeadContactAttemptRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listByLeadId(int $leadId): array
    {
        $statement = $this->database->prepare(
            'SELECT * FROM lead_contact_attempts WHERE lead_id = :lead_id ORDER BY contacted_at DESC, created_at DESC'
        );
        $statement->execute(['lead_id' => $leadId]);
        return $statement->fetchAll();
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO lead_contact_attempts (
                public_id, lead_id, contacted_at, method, direction, outcome, notes, actor_user_id
            ) VALUES (
                :public_id, :lead_id, :contacted_at, :method, :direction, :outcome, :notes, :actor_user_id
            )'
        );
        $statement->execute($row);
        return (int) $this->database->lastInsertId();
    }
}
