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
        // conferenceProperties.allowedConferenceSolutionTypes is the real,
        // documented Calendar API field for what a calendar can actually
        // create conferences for -- reported as-is rather than assumed
        // true just because the calendar itself is reachable.
        $allowedTypes = $record->getConferenceProperties()?->getAllowedConferenceSolutionTypes() ?? [];
        return [
            'connected' => trim((string) $record->getId()) !== '',
            'calendar_accessible' => true,
            'meet_capable' => in_array('hangoutsMeet', $allowedTypes, true),
        ];
    }

    public function configured(): bool
    {
        return trim((string) ($this->config['calendar_id'] ?? '')) !== '';
    }

    public function synchronizeAppointment(array $appointment): array
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
            // A cancelled appointment's history (including what its
            // meeting link used to be) is preserved, not cleared -- only an
            // active appointment whose location moved away from Google
            // Meet has its join link actively removed, below.
            return ['event_id' => $eventId, 'meeting_url' => null, 'clear_meeting_url' => false];
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
            'location' => (string) ($appointment['location'] ?? ''),
        ]);
        $requiresMeet = (string) ($appointment['meeting_method'] ?? '') === 'google_meet';
        $hadMeetingUrl = !empty($appointment['meeting_url']);
        // requestId is deterministic (derived from the appointment's own
        // public_id, not random), so a retried/duplicate sync after a
        // partial failure asks Google for the SAME conference again rather
        // than creating a second Meet room.
        $requestsNewConference = $requiresMeet && !$hadMeetingUrl;
        // The appointment no longer uses Google Meet but the Calendar
        // event still carries conference data from when it did -- clear it
        // so the event stops advertising a join link nobody should use.
        $clearsExistingConference = !$requiresMeet && $hadMeetingUrl;
        if ($requestsNewConference) {
            $event->setConferenceData(new Google\Service\Calendar\ConferenceData([
                'createRequest' => [
                    'requestId' => 'alchemize-' . substr(hash('sha256', (string) $appointment['public_id']), 0, 24),
                    'conferenceSolutionKey' => ['type' => 'hangoutsMeet'],
                ],
            ]));
        } elseif ($clearsExistingConference) {
            $event->setConferenceData(new Google\Service\Calendar\ConferenceData());
        }
        // conferenceDataVersion=1 is required by the Calendar API for ANY
        // conferenceData change, including removal -- not only creation.
        $options = ($requestsNewConference || $clearsExistingConference) ? ['conferenceDataVersion' => 1] : [];
        try {
            if (!empty($appointment['google_calendar_event_id'])) $saved = $calendar->events->update($calendarId, $eventId, $event, $options);
            else $saved = $calendar->events->insert($calendarId, $event, $options);
        } catch (Google\Service\Exception $error) {
            if ((int) $error->getCode() !== 409) throw $error;
            $saved = $calendar->events->update($calendarId, $eventId, $event, $options);
        }
        return [
            'event_id' => $eventId,
            'meeting_url' => $requiresMeet ? (string) $saved->getHangoutLink() : null,
            'clear_meeting_url' => $clearsExistingConference,
        ];
    }

    public function busyPeriods(DateTimeImmutable $start, DateTimeImmutable $end, string $timezone): array
    {
        if (!$this->configured()) return [];
        if (!class_exists('Google\\Service\\Calendar')) throw new RuntimeException('The Google Calendar service library is not installed.');
        $calendar = new Google\Service\Calendar($this->clients->create(['https://www.googleapis.com/auth/calendar.readonly']));
        $request = new Google\Service\Calendar\FreeBusyRequest([
            'timeMin' => $start->format(DateTimeInterface::RFC3339),
            'timeMax' => $end->format(DateTimeInterface::RFC3339),
            'timeZone' => $timezone,
            'items' => [['id' => (string) $this->config['calendar_id']]],
        ]);
        $response = $calendar->freebusy->query($request);
        $calendarBusy = $response->getCalendars()[(string) $this->config['calendar_id']] ?? null;
        if ($calendarBusy === null || $calendarBusy->getErrors()) throw new RuntimeException('Calendar busy periods could not be verified.');
        return array_map(static fn ($period): array => ['start' => $period->getStart(), 'end' => $period->getEnd()], $calendarBusy->getBusy());
    }
}
