<?php

declare(strict_types=1);

final class AlchemizeStripeWebhookRepository
{
    public function __construct(private readonly PDO $database) {}

    public function findByStripeEventId(string $stripeEventId): ?array
    {
        $statement = $this->database->prepare(
            'SELECT * FROM stripe_webhook_events WHERE stripe_event_id = :stripe_event_id LIMIT 1'
        );
        $statement->execute(['stripe_event_id' => $stripeEventId]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function create(array $row): void
    {
        $statement = $this->database->prepare(
            'INSERT INTO stripe_webhook_events (
                public_id, stripe_event_id, event_type, event_status, payload, processed_at
            ) VALUES (
                :public_id, :stripe_event_id, :event_type, :event_status, :payload, :processed_at
            )'
        );
        $statement->execute($row);
    }

    public function updateStatus(string $stripeEventId, string $status): void
    {
        $statement = $this->database->prepare(
            'UPDATE stripe_webhook_events
             SET event_status = :event_status,
                 processed_at = CURRENT_TIMESTAMP(6)
             WHERE stripe_event_id = :stripe_event_id'
        );
        $statement->execute([
            'event_status' => $status,
            'stripe_event_id' => $stripeEventId,
        ]);
    }
}
