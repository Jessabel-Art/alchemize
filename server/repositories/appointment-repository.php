<?php

declare(strict_types=1);

final class AlchemizeAppointmentRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listAll(): array
    {
        $statement = $this->database->query('SELECT * FROM appointments ORDER BY scheduled_at ASC');
        return $statement->fetchAll();
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO appointments (
                public_id, client_id, lead_id, engagement_id, appointment_type, service_id,
                scheduled_at, end_at, timezone, location_type, status, preparation_required,
                follow_up_required, internal_notes, owner_user_id
            ) VALUES (
                :public_id, :client_id, :lead_id, :engagement_id, :appointment_type, :service_id,
                :scheduled_at, :end_at, :timezone, :location_type, :status, :preparation_required,
                :follow_up_required, :internal_notes, :owner_user_id
            )'
        );
        $statement->execute($row);
        return (int) $this->database->lastInsertId();
    }

    public function update(int $id, array $values): void
    {
        if ($values === []) {
            return;
        }
        $fields = [];
        foreach (array_keys($values) as $field) {
            $fields[] = sprintf('%s = :%s', $field, $field);
        }
        $sql = 'UPDATE appointments SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $statement = $this->database->prepare($sql);
        $values['id'] = $id;
        $statement->execute($values);
    }
}
