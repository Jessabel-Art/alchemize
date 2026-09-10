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

    public function staffNotificationDeliveryMode(): string
    {
        $row = $this->database->query("SELECT setting_value FROM application_settings WHERE setting_key = 'staff_notification_delivery_mode' LIMIT 1")->fetch();
        if ($row === false || $row === null) return 'both';
        $value = json_decode((string) $row['setting_value'], true);
        $mode = is_string($value) ? strtolower(trim($value)) : (is_string($row['setting_value']) ? strtolower(trim((string) $row['setting_value'])) : 'both');
        return in_array($mode, ['email', 'dashboard', 'both', 'disabled'], true) ? $mode : 'both';
    }

    public function businessNotificationEmail(): string
    {
        $row = $this->database->query("SELECT setting_value FROM application_settings WHERE setting_key = 'business_email' LIMIT 1")->fetch();
        if ($row === false || $row === null) return '';
        $value = json_decode((string) $row['setting_value'], true);
        $email = is_string($value) ? trim($value) : trim((string) $row['setting_value']);
        return $email;
    }

    public function recordDelivery(string $publicId, string $status, ?string $error = null): void
    {
        $allowed = ['sent', 'failed', 'unavailable'];
        if (!in_array($status, $allowed, true)) $status = 'failed';

        $deliveryError = $status === 'sent' ? null : ($error ?? ($status === 'unavailable' ? 'not_configured' : 'provider_error'));

        if (!$this->columnExists('notifications', 'delivery_status')) {
            return;
        }

        $fields = ['delivery_status = :status', 'delivery_attempted_at = CURRENT_TIMESTAMP(6)'];
        $params = [
            'status' => $status,
            'error' => $deliveryError,
            'public_id' => $publicId,
        ];

        if ($this->columnExists('notifications', 'delivered_at')) {
            // Resolved in PHP instead of IF(:status_sent = 'sent', ...) in
            // SQL: with PDO::ATTR_EMULATE_PREPARES disabled, MySQL sends
            // bound string parameters with utf8mb4_general_ci while inline
            // literals use the connection's utf8mb4_unicode_ci, so
            // comparing a bound parameter directly against a literal
            // throws "Illegal mix of collations" (SQLSTATE HY000 1267).
            $fields[] = 'delivered_at = ' . ($status === 'sent' ? 'CURRENT_TIMESTAMP(6)' : 'delivered_at');
        }
        if ($this->columnExists('notifications', 'delivery_error')) {
            $fields[] = 'delivery_error = :error';
        }

        $statement = $this->database->prepare(
            'UPDATE notifications SET ' . implode(', ', $fields) . ' WHERE public_id = :public_id'
        );
        $statement->execute($params);
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

    private function columnExists(string $table, string $column): bool
    {
        try {
            $statement = $this->database->prepare('SHOW COLUMNS FROM ' . $table . ' LIKE :column');
            $statement->execute(['column' => $column]);
            return $statement->fetch() !== false;
        } catch (Throwable) {
            return false;
        }
    }
}
