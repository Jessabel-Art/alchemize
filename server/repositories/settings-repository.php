<?php

declare(strict_types=1);

final class AlchemizeSettingsRepository
{
    // Existing migration defaults belong here, never in the browser.
    private const DEFAULTS = [
        'business_name' => 'Alchemize Business Services',
        'business_email' => '',
        'timezone' => 'America/New_York',
        'appointment_default_duration' => 60,
        'portal_message_email_notifications' => true,
        'staff_notification_delivery_mode' => 'both',
        'default_client_language' => null,
        'default_meeting_method' => null,
        'default_owner_user_id' => null,
        'default_lead_owner_user_id' => null,
        'default_engagement_owner_user_id' => null,
        'prospect_follow_up_days' => null,
        'document_request_due_days' => null,
        'invoice_payment_terms_days' => null,
        'invoice_footer' => null,
        'appointment_reminder_minutes' => null,
    ];

    public function __construct(private readonly PDO $database) {}

    public static function normalize(array $values): array
    {
        $values = array_intersect_key($values, self::DEFAULTS);
        $ranges = [
            'appointment_default_duration' => [15, 480],
            'prospect_follow_up_days' => [1, 365],
            'document_request_due_days' => [1, 365],
            'invoice_payment_terms_days' => [0, 365],
            'appointment_reminder_minutes' => [1, 43200],
        ];
        foreach ($values as $key => &$value) {
            if ($value === null && self::DEFAULTS[$key] === null) continue;
            $valid = true;
            if (isset($ranges[$key])) {
                $valid = is_int($value) && $value >= $ranges[$key][0] && $value <= $ranges[$key][1];
            } elseif ($key === 'portal_message_email_notifications') {
                // Normalize legacy JSON strings without PHP's truthy "false" behavior.
                if (in_array($value, ['true', 'false', 0, 1, '0', '1'], true)) {
                    $value = in_array($value, ['true', 1, '1'], true);
                }
                $valid = is_bool($value);
            } elseif ($key === 'staff_notification_delivery_mode') {
                if (is_string($value)) {
                    $value = strtolower(trim($value));
                }
                $valid = in_array($value, ['email', 'dashboard', 'both', 'disabled'], true);
            } else {
                $valid = is_string($value);
                if ($valid) {
                    $value = trim($value);
                    $valid = match ($key) {
                        'business_name' => $value !== '' && strlen($value) <= 150,
                        'business_email' => strlen($value) <= 254 && ($value === '' || filter_var($value, FILTER_VALIDATE_EMAIL) !== false),
                        'timezone' => in_array($value, timezone_identifiers_list(), true),
                        'default_client_language' => in_array($value, ['en', 'es'], true),
                        'default_meeting_method' => in_array($value, ['phone_call', 'video_call', 'in_person'], true),
                        'invoice_footer' => strlen($value) <= 2000,
                        default => preg_match('/^[a-f0-9-]{36}$/i', $value) === 1,
                    };
                }
            }
            if (!$valid) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Enter a valid value for ' . str_replace('_', ' ', $key) . '.');
        }
        unset($value);
        return $values;
    }

    public function all(): array
    {
        $rows = $this->database->query('SELECT setting_key, setting_value FROM application_settings ORDER BY setting_key')->fetchAll();
        $settings = self::DEFAULTS;
        foreach ($rows as $row) {
            $key = (string) $row['setting_key'];
            if (!array_key_exists($key, self::DEFAULTS)) continue;
            $value = json_decode((string) $row['setting_value'], true, 8, JSON_THROW_ON_ERROR);
            if ($key === 'appointment_default_duration' && is_numeric($value)) $value = (int) $value;
            $settings[$key] = self::normalize([$key => $value])[$key];
        }
        return $settings;
    }

    public function update(array $values, int $actorId): array
    {
        $values = self::normalize($values);
        foreach (['default_owner_user_id', 'default_lead_owner_user_id', 'default_engagement_owner_user_id'] as $key) {
            if (!isset($values[$key])) continue;
            $owner = $this->database->prepare("SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE u.public_id = :id AND u.status = 'active' AND r.is_active = 1 AND r.slug IN ('owner-admin','administrator','staff')");
            $owner->execute(['id' => $values[$key]]);
            if (!$owner->fetchColumn()) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Choose an active internal owner.');
        }
        $this->database->beginTransaction();
        try {
            $statement = $this->database->prepare(
                'INSERT INTO application_settings (setting_key, setting_value, updated_by_user_id)
                 VALUES (:setting_key, :setting_value, :actor)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by_user_id = VALUES(updated_by_user_id)'
            );
            foreach ($values as $key => $value) {
                $statement->execute(['setting_key' => $key, 'setting_value' => json_encode($value, JSON_THROW_ON_ERROR), 'actor' => $actorId]);
            }
            $saved = $this->all();
            $this->database->commit();
            return $saved;
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $error;
        }
    }
}
