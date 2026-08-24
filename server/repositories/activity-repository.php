<?php

declare(strict_types=1);

final class AlchemizeActivityRepository
{
    public function __construct(private readonly PDO $database) {}

    public function create(array $event): void
    {
        $statement = $this->database->prepare(
            'INSERT INTO activity_events
                (public_id, event_type, actor_type, actor_user_id, entity_type, entity_id, lead_id, client_id, engagement_id, summary, visibility)
             VALUES
                (:public_id, :event_type, :actor_type, :actor_user_id, :entity_type, :entity_id, :lead_id, :client_id, :engagement_id, :summary, :visibility)',
        );
        $statement->execute([
            'public_id' => $event['public_id'],
            'event_type' => $event['event_type'],
            'actor_type' => $event['actor_type'],
            'actor_user_id' => $event['actor_user_id'] ?? null,
            'entity_type' => $event['entity_type'],
            'entity_id' => $event['entity_id'],
            'lead_id' => $event['lead_id'] ?? null,
            'client_id' => $event['client_id'] ?? null,
            'engagement_id' => $event['engagement_id'] ?? null,
            'summary' => $event['summary'],
            'visibility' => $event['visibility'] ?? 'admin',
        ]);
    }
}
