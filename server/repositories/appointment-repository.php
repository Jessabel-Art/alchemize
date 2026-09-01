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

    public function listAvailability(): array
    {
        $statement = $this->database->query(
            'SELECT * FROM appointment_availability ORDER BY weekday ASC, start_time ASC, date_override ASC'
        );
        return $statement->fetchAll();
    }

    public function createAvailability(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO appointment_availability (
                public_id, user_id, weekday, date_override, start_time, end_time,
                is_available, kind, notes, created_by_user_id
            ) VALUES (
                :public_id, :user_id, :weekday, :date_override, :start_time, :end_time,
                :is_available, :kind, :notes, :created_by_user_id
            )'
        );
        $statement->execute($row);
        return (int) $this->database->lastInsertId();
    }

    public function findSchedulingLink(string $token): ?array
    {
        $statement = $this->database->prepare(
            'SELECT * FROM appointment_scheduling_links WHERE token_hash = :token_hash AND expires_at > CURRENT_TIMESTAMP(6) AND used_at IS NULL LIMIT 1'
        );
        $statement->execute(['token_hash' => hash('sha256', $token)]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function createSchedulingLink(array $row): string
    {
        $token = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
        $statement = $this->database->prepare(
            'INSERT INTO appointment_scheduling_links (
                public_id, token_hash, client_id, lead_id, appointment_type, meeting_method,
                expires_at, created_by_user_id, recipient_name, recipient_email, notes
            ) VALUES (
                :public_id, :token_hash, :client_id, :lead_id, :appointment_type, :meeting_method,
                :expires_at, :created_by_user_id, :recipient_name, :recipient_email, :notes
            )'
        );
        $statement->execute([
            'public_id' => $row['public_id'],
            'token_hash' => hash('sha256', $token),
            'client_id' => $row['client_id'] ?? null,
            'lead_id' => $row['lead_id'] ?? null,
            'appointment_type' => $row['appointment_type'] ?? 'Consultation',
            'meeting_method' => $row['meeting_method'] ?? 'phone',
            'expires_at' => $row['expires_at'],
            'created_by_user_id' => $row['created_by_user_id'] ?? null,
            'recipient_name' => $row['recipient_name'] ?? null,
            'recipient_email' => $row['recipient_email'] ?? null,
            'notes' => $row['notes'] ?? null,
        ]);
        return $token;
    }

    public function markSchedulingLinkUsed(int $id): void
    {
        $this->database->prepare('UPDATE appointment_scheduling_links SET used_at = CURRENT_TIMESTAMP(6) WHERE id = :id')
            ->execute(['id' => $id]);
    }

    public function findById(int $id): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM appointments WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]); $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO appointments (
                public_id, client_id, lead_id, engagement_id, appointment_type, service_id,
                scheduled_at, end_at, timezone, location_type, meeting_method, meeting_url, location,
                duration_minutes, status, visibility, client_instructions, preparation_required,
                follow_up_required, internal_notes, owner_user_id, source, scheduling_token, scheduling_context
            ) VALUES (
                :public_id, :client_id, :lead_id, :engagement_id, :appointment_type, :service_id,
                :scheduled_at, :end_at, :timezone, :location_type, :meeting_method, :meeting_url, :location,
                :duration_minutes, :status, :visibility, :client_instructions, :preparation_required,
                :follow_up_required, :internal_notes, :owner_user_id, :source, :scheduling_token, :scheduling_context
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
