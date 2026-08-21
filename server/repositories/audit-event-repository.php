<?php

declare(strict_types=1);

final class AlchemizeAuditEventRepository
{
    public function __construct(private readonly PDO $database) {}

    public function create(array $row): void
    {
        $statement = $this->database->prepare(
            'INSERT INTO audit_events (
                public_id, actor_user_id, event_type, entity_type, entity_id, action_summary, request_metadata
            ) VALUES (
                :public_id, :actor_user_id, :event_type, :entity_type, :entity_id, :action_summary, :request_metadata
            )'
        );
        $statement->execute($row);
    }
}
