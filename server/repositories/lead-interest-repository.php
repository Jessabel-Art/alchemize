<?php

declare(strict_types=1);

final class AlchemizeLeadInterestRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listByLeadId(int $leadId): array
    {
        $statement = $this->database->prepare(
            'SELECT * FROM lead_service_interests WHERE lead_id = :lead_id ORDER BY created_at DESC'
        );
        $statement->execute(['lead_id' => $leadId]);
        return $statement->fetchAll();
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO lead_service_interests (lead_id, service_id, custom_interest) VALUES (:lead_id, :service_id, :custom_interest)'
        );
        $statement->execute($row);
        return (int) $this->database->lastInsertId();
    }
}
