<?php

declare(strict_types=1);

final class AlchemizeActivityRepository
{
    public function __construct(private readonly PDO $database) {}

    public function create(array $event): void
    {
        $statement = $this->database->prepare(
            'INSERT INTO activity_events
                (public_id, event_type, actor_type, entity_type, entity_id, lead_id, summary, visibility)
             VALUES
                (:public_id, :event_type, :actor_type, :entity_type, :entity_id, :lead_id, :summary, :visibility)',
        );
        $statement->execute($event);
    }
}
