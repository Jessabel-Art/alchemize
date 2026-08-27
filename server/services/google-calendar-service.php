<?php

declare(strict_types=1);

final class AlchemizeGoogleCalendarService
{
    public function __construct(
        private readonly AlchemizeGoogleClientFactory $clients,
        private readonly array $config,
    ) {}

    public function verifyConnection(): array
    {
        $client = $this->clients->create(['https://www.googleapis.com/auth/calendar.events']);
        if (!class_exists('Google\\Service\\Calendar')) {
            throw new RuntimeException('The Google Calendar service library is not installed.');
        }

        $calendar = new Google\Service\Calendar($client);
        $record = $calendar->calendars->get((string) $this->config['calendar_id']);
        return [
            'connected' => trim((string) $record->getId()) !== '',
            'calendar_accessible' => true,
        ];
    }

    public function configured(): bool
    {
        return trim((string) ($this->config['calendar_id'] ?? '')) !== '';
    }

    public function synchronizeAppointment(array $appointment): string
    {
        if (!$this->configured()) throw new RuntimeException('Google Calendar is not configured.');
        if (!class_exists('Google\\Service\\Calendar')) throw new RuntimeException('The Google Calendar service library is not installed.');
        $calendar = new Google\Service\Calendar($this->clients->create(['https://www.googleapis.com/auth/calendar.events']));
        $calendarId = (string) $this->config['calendar_id'];
        $eventId = trim((string) ($appointment['google_calendar_event_id'] ?? ''));
        if ($eventId === '') $eventId = 'alchemize' . substr(hash('sha256', (string) $appointment['public_id']), 0, 40);
        if ((string) $appointment['status'] === 'cancelled') {
            try { $calendar->events->delete($calendarId, $eventId); } catch (Google\Service\Exception $error) {
                if ((int) $error->getCode() !== 404) throw $error;
            }
            return $eventId;
        }
        $timezone = trim((string) ($appointment['timezone'] ?? 'UTC')) ?: 'UTC';
        $start = new DateTimeImmutable((string) $appointment['scheduled_at'], new DateTimeZone($timezone));
        $end = !empty($appointment['end_at'])
            ? new DateTimeImmutable((string) $appointment['end_at'], new DateTimeZone($timezone))
            : $start->modify('+1 hour');
        $event = new Google\Service\Calendar\Event([
            'id' => $eventId, 'summary' => (string) $appointment['appointment_type'],
            'description' => 'Managed by Alchemize. Reference: ' . (string) $appointment['public_id'],
            'start' => ['dateTime' => $start->format(DateTimeInterface::RFC3339), 'timeZone' => $timezone],
            'end' => ['dateTime' => $end->format(DateTimeInterface::RFC3339), 'timeZone' => $timezone],
        ]);
        try {
            if (!empty($appointment['google_calendar_event_id'])) $calendar->events->update($calendarId, $eventId, $event);
            else $calendar->events->insert($calendarId, $event);
        } catch (Google\Service\Exception $error) {
            if ((int) $error->getCode() !== 409) throw $error;
            $calendar->events->update($calendarId, $eventId, $event);
        }
        return $eventId;
    }
}
