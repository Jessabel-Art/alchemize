<?php

declare(strict_types=1);

final class AlchemizeLeadRepository
{
    public function __construct(private readonly PDO $database) {}

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
}
