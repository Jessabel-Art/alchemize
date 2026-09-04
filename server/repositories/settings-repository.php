<?php

declare(strict_types=1);

final class AlchemizeSettingsRepository
{
    public function __construct(private readonly PDO $database) {}

    public function all(): array
    {
        $rows = $this->database->query('SELECT setting_key, setting_value FROM application_settings ORDER BY setting_key')->fetchAll();
        $settings = [];
        foreach ($rows as $row) {
            $settings[(string) $row['setting_key']] = json_decode((string) $row['setting_value'], true, 8, JSON_THROW_ON_ERROR);
        }
        return $settings;
    }

    public function update(array $values, int $actorId): array
    {
        $statement = $this->database->prepare(
            'INSERT INTO application_settings (setting_key, setting_value, updated_by_user_id)
             VALUES (:setting_key, :setting_value, :actor)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by_user_id = VALUES(updated_by_user_id)'
        );
        foreach ($values as $key => $value) {
            $statement->execute([
                'setting_key' => $key,
                'setting_value' => json_encode($value, JSON_THROW_ON_ERROR),
                'actor' => $actorId,
            ]);
        }
        return $this->all();
    }
}
