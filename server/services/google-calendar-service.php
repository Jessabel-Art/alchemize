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
}
