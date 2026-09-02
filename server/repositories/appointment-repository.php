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
                public_id, user_id, weekday, date_override, end_date, start_time, end_time,
                timezone, is_available, kind, notes, created_by_user_id
            ) VALUES (
                :public_id, :user_id, :weekday, :date_override, :end_date, :start_time, :end_time,
                :timezone, :is_available, :kind, :notes, :created_by_user_id
            )'
        );
        $statement->execute($row);
        return (int) $this->database->lastInsertId();
    }

    public function findSchedulingLink(string $token): ?array
    {
        $statement = $this->database->prepare(
            'SELECT asl.*, s.name AS service_name
             FROM appointment_scheduling_links asl
             LEFT JOIN services s ON s.id = asl.service_id
             WHERE asl.token_hash = :token_hash
               AND asl.expires_at > CURRENT_TIMESTAMP(6)
               AND asl.revoked_at IS NULL
               AND asl.use_count < asl.max_uses
             LIMIT 1'
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
                public_id, token_hash, client_id, lead_id, service_id, appointment_type, meeting_method,
                duration_minutes, timezone, location, expires_at, max_uses, created_by_user_id,
                recipient_name, recipient_email, recipient_phone, notes
            ) VALUES (
                :public_id, :token_hash, :client_id, :lead_id, :service_id, :appointment_type, :meeting_method,
                :duration_minutes, :timezone, :location, :expires_at, :max_uses, :created_by_user_id,
                :recipient_name, :recipient_email, :recipient_phone, :notes
            )'
        );
        $statement->execute([
            'public_id' => $row['public_id'],
            'token_hash' => hash('sha256', $token),
            'client_id' => $row['client_id'] ?? null,
            'lead_id' => $row['lead_id'] ?? null,
            'service_id' => $row['service_id'] ?? null,
            'appointment_type' => $row['appointment_type'] ?? 'Consultation',
            'meeting_method' => $row['meeting_method'] ?? 'phone',
            'duration_minutes' => $row['duration_minutes'] ?? 60,
            'timezone' => $row['timezone'] ?? 'America/New_York',
            'location' => $row['location'] ?? null,
            'expires_at' => $row['expires_at'],
            'max_uses' => $row['max_uses'] ?? 1,
            'created_by_user_id' => $row['created_by_user_id'] ?? null,
            'recipient_name' => $row['recipient_name'] ?? null,
            'recipient_email' => $row['recipient_email'] ?? null,
            'recipient_phone' => $row['recipient_phone'] ?? null,
            'notes' => $row['notes'] ?? null,
        ]);
        return $token;
    }

    public function markSchedulingLinkUsed(int $id): void
    {
        $this->database->prepare(
            'UPDATE appointment_scheduling_links
             SET use_count = use_count + 1,
                 used_at = IF(use_count + 1 >= max_uses, CURRENT_TIMESTAMP(6), used_at)
             WHERE id = :id AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP(6) AND use_count < max_uses'
        )
            ->execute(['id' => $id]);
    }

    public function recordSchedulingLinkDelivery(int $id, string $status): void
    {
        $allowed = ['sent', 'failed', 'unavailable'];
        if (!in_array($status, $allowed, true)) $status = 'failed';
        $this->database->prepare(
            'UPDATE appointment_scheduling_links
             SET delivery_status = :status, delivery_attempted_at = CURRENT_TIMESTAMP(6),
                 delivery_error = IF(:sent = \'sent\', NULL, :error)
             WHERE id = :id'
        )->execute(['status' => $status, 'sent' => $status, 'error' => $status === 'unavailable' ? 'not_configured' : 'provider_error', 'id' => $id]);
    }

    public function schedulingLinkIdByToken(string $token): ?int
    {
        $statement = $this->database->prepare('SELECT id FROM appointment_scheduling_links WHERE token_hash = :hash LIMIT 1');
        $statement->execute(['hash' => hash('sha256', $token)]);
        $id = $statement->fetchColumn();
        return $id === false ? null : (int) $id;
    }

    public function availabilityForDate(string $date): array
    {
        $weekday = (int) (new DateTimeImmutable($date))->format('N');
        $statement = $this->database->prepare(
            'SELECT * FROM appointment_availability
             WHERE (kind = \'weekday\' AND weekday = :weekday)
                OR (kind = \'date_override\' AND date_override = :date)
                OR (kind IN (\'blocked\',\'full_day\',\'time_off\')
                    AND date_override <= :date2 AND COALESCE(end_date, date_override) >= :date3)
             ORDER BY kind, start_time'
        );
        $statement->execute(['weekday' => $weekday, 'date' => $date, 'date2' => $date, 'date3' => $date]);
        return $statement->fetchAll();
    }

    public function appointmentConflicts(string $start, string $end): array
    {
        $statement = $this->database->prepare(
            "SELECT id, scheduled_at, COALESCE(end_at, DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE)) AS end_at
             FROM appointments
             WHERE status <> 'cancelled'
               AND scheduled_at < :end_at
               AND COALESCE(end_at, DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE)) > :start_at"
        );
        $statement->execute(['start_at' => $start, 'end_at' => $end]);
        return $statement->fetchAll();
    }

    public function updateAvailability(int $id, array $values): void
    {
        $allowed = ['weekday','date_override','end_date','start_time','end_time','timezone','is_available','kind','notes','user_id'];
        $filtered = array_intersect_key($values, array_flip($allowed));
        $this->updateTable('appointment_availability', $id, $filtered);
    }

    public function deleteAvailability(int $id): void
    {
        $statement = $this->database->prepare('DELETE FROM appointment_availability WHERE id = :id');
        $statement->execute(['id' => $id]);
    }

    public function recordAppointmentEvents(int $appointmentId, array $appointment, string $eventType, string $summary): void
    {
        $publicId = (string) ($appointment['public_id'] ?? $appointmentId);
        $this->database->prepare(
            'INSERT INTO activity_events
             (public_id, event_type, actor_type, entity_type, entity_id, lead_id, client_id, engagement_id, summary, visibility)
             VALUES (:public_id, :event_type, :actor_type, \'appointment\', :entity_id, :lead_id, :client_id, :engagement_id, :summary, :visibility)'
        )->execute([
            'public_id' => alchemize_uuid_v4(), 'event_type' => $eventType,
            'actor_type' => $eventType === 'appointment.public_booked' ? 'public_scheduler' : 'admin',
            'entity_id' => $publicId, 'lead_id' => $appointment['lead_id'] ?? null,
            'client_id' => $appointment['client_id'] ?? null, 'engagement_id' => $appointment['engagement_id'] ?? null,
            'summary' => $summary, 'visibility' => !empty($appointment['client_id']) ? 'both' : 'admin',
        ]);
        $this->database->prepare(
            'INSERT INTO audit_events
             (public_id, actor_user_id, event_type, entity_type, entity_id, action_summary, request_metadata)
             VALUES (:public_id, NULL, :event_type, \'appointment\', :entity_id, :summary, :metadata)'
        )->execute([
            'public_id' => alchemize_uuid_v4(), 'event_type' => $eventType,
            'entity_id' => $publicId, 'summary' => $summary,
            'metadata' => json_encode(['appointment_id' => $appointmentId], JSON_THROW_ON_ERROR),
        ]);
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
                follow_up_required, internal_notes, owner_user_id, source, scheduling_link_id, scheduling_context
            ) VALUES (
                :public_id, :client_id, :lead_id, :engagement_id, :appointment_type, :service_id,
                :scheduled_at, :end_at, :timezone, :location_type, :meeting_method, :meeting_url, :location,
                :duration_minutes, :status, :visibility, :client_instructions, :preparation_required,
                :follow_up_required, :internal_notes, :owner_user_id, :source, :scheduling_link_id, :scheduling_context
            )'
        );
        $defaults = [
            'client_id' => null, 'lead_id' => null, 'engagement_id' => null, 'service_id' => null,
            'end_at' => null, 'timezone' => 'America/New_York', 'location_type' => null,
            'meeting_method' => 'phone', 'meeting_url' => null, 'location' => null,
            'duration_minutes' => 60, 'status' => 'scheduled', 'visibility' => 'admin',
            'client_instructions' => null, 'preparation_required' => 0, 'follow_up_required' => 0,
            'internal_notes' => null, 'owner_user_id' => null, 'source' => 'admin',
            'scheduling_link_id' => null, 'scheduling_context' => null,
        ];
        $statement->execute(array_replace($defaults, $row));
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

    private function updateTable(string $table, int $id, array $values): void
    {
        if ($values === []) return;
        $fields = [];
        foreach (array_keys($values) as $field) $fields[] = sprintf('%s = :%s', $field, $field);
        $values['id'] = $id;
        $this->database->prepare('UPDATE ' . $table . ' SET ' . implode(', ', $fields) . ' WHERE id = :id')->execute($values);
    }
}
