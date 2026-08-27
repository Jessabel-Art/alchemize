<?php

declare(strict_types=1);

final class AlchemizeNotificationRepository
{
    public function __construct(private readonly PDO $database) {}

    public function staffRecipientIds(): array
    {
        return array_map('intval', $this->database->query(
            "SELECT u.id FROM users u INNER JOIN roles r ON r.id = u.role_id
             WHERE u.status = 'active' AND r.slug IN ('owner-admin','administrator','staff')"
        )->fetchAll(PDO::FETCH_COLUMN));
    }

    public function staffRecipients(): array
    {
        return $this->database->query(
            "SELECT u.id, u.email FROM users u INNER JOIN roles r ON r.id = u.role_id
             WHERE u.status = 'active' AND r.slug IN ('owner-admin','administrator','staff')"
        )->fetchAll();
    }

    public function clientRecipients(int $clientId): array
    {
        $statement = $this->database->prepare(
            "SELECT DISTINCT u.id, u.email, COALESCE(c.language_preference, 'en') AS language_preference
             FROM client_access_grants cag
             INNER JOIN users u ON u.id = cag.user_id AND u.status = 'active'
             INNER JOIN clients c ON c.id = cag.client_id
             WHERE cag.client_id = :client_id AND cag.status = 'active'
               AND cag.effective_at <= CURRENT_TIMESTAMP(6)
               AND (cag.expires_at IS NULL OR cag.expires_at > CURRENT_TIMESTAMP(6))"
        );
        $statement->execute(['client_id' => $clientId]);
        return $statement->fetchAll();
    }

    public function create(array $row): bool
    {
        $statement = $this->database->prepare(
            'INSERT IGNORE INTO notifications
                (public_id, recipient_user_id, client_id, event_type, related_entity_type,
                 related_entity_id, title, message_body, language_preference, dedupe_key)
             VALUES
                (:public_id, :recipient_user_id, :client_id, :event_type, :related_entity_type,
                 :related_entity_id, :title, :message_body, :language_preference, :dedupe_key)'
        );
        $statement->execute($row);
        return $statement->rowCount() === 1;
    }

    public function recordDelivery(string $publicId, string $status, ?string $error = null): void
    {
        $allowed = ['sent', 'failed', 'unavailable'];
        if (!in_array($status, $allowed, true)) $status = 'failed';
        $statement = $this->database->prepare(
            'UPDATE notifications SET delivery_status = :status, delivery_attempted_at = CURRENT_TIMESTAMP(6),
             delivered_at = IF(:status_sent = \'sent\', CURRENT_TIMESTAMP(6), delivered_at), delivery_error = :error
             WHERE public_id = :public_id'
        );
        $statement->execute([
            'status' => $status, 'status_sent' => $status,
            'error' => $status === 'sent' ? null : ($error ?? ($status === 'unavailable' ? 'not_configured' : 'provider_error')),
            'public_id' => $publicId,
        ]);
    }

    public function listForUser(int $userId): array
    {
        $statement = $this->database->prepare(
            'SELECT public_id AS id, event_type, related_entity_type, related_entity_id,
                    title, message_body, language_preference, read_at, created_at
             FROM notifications WHERE recipient_user_id = :user_id
             ORDER BY created_at DESC LIMIT 50'
        );
        $statement->execute(['user_id' => $userId]);
        return $statement->fetchAll();
    }

    public function markRead(string $publicId, int $userId): bool
    {
        $statement = $this->database->prepare(
            'UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP(6))
             WHERE public_id = :id AND recipient_user_id = :user_id'
        );
        $statement->execute(['id' => $publicId, 'user_id' => $userId]);
        return $statement->rowCount() === 1;
    }
}
