<?php

declare(strict_types=1);

final class AlchemizeAppointmentSchedulingService
{
    public function __construct(
        private readonly AlchemizeAppointmentRepository $repository,
        private readonly string $defaultTimezone = 'America/New_York',
    ) {}

    public function publicContext(array $link): array
    {
        return [
            'recipient_name' => (string) ($link['recipient_name'] ?? ''),
            'recipient_email' => (string) ($link['recipient_email'] ?? ''),
            'recipient_phone' => (string) ($link['recipient_phone'] ?? ''),
            'appointment_type' => (string) $link['appointment_type'],
            'meeting_method' => (string) $link['meeting_method'],
            'service' => (string) ($link['service_name'] ?? ''),
            'timezone' => (string) ($link['timezone'] ?? $this->defaultTimezone),
            'duration_minutes' => (int) ($link['duration_minutes'] ?? 60),
            'expires_at' => (string) $link['expires_at'],
        ];
    }

    public function slots(array $link, string $date, array $externalBusy = []): array
    {
        $timezoneName = (string) ($link['timezone'] ?? $this->defaultTimezone);
        try {
            $timezone = new DateTimeZone($timezoneName);
            $day = new DateTimeImmutable($date . ' 00:00:00', $timezone);
        } catch (Throwable) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'A valid scheduling date is required.');
        }
        if ($day->format('Y-m-d') !== $date) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'A valid scheduling date is required.');
        }

        $rows = $this->repository->availabilityForDate($date);
        $overrides = array_values(array_filter($rows, static fn (array $row): bool => $row['kind'] === 'date_override'));
        $working = $overrides !== []
            ? array_values(array_filter($overrides, static fn (array $row): bool => (int) $row['is_available'] === 1))
            : array_values(array_filter($rows, static fn (array $row): bool => $row['kind'] === 'weekday' && (int) $row['is_available'] === 1));
        if ($working === []) {
            $working = $this->defaultBusinessScheduleForDate($date);
        }

        $blocks = array_values(array_filter($rows, static fn (array $row): bool => in_array($row['kind'], ['blocked','full_day','time_off'], true)));
        if (array_filter($blocks, static fn (array $row): bool => in_array($row['kind'], ['full_day','time_off'], true))) return [];
        if ($overrides !== [] && $working === []) return [];

        $duration = max(15, (int) ($link['duration_minutes'] ?? 60));
        $slots = [];
        foreach ($working as $period) {
            if (empty($period['start_time']) || empty($period['end_time'])) continue;
            $cursor = new DateTimeImmutable($date . ' ' . $period['start_time'], $timezone);
            $periodEnd = new DateTimeImmutable($date . ' ' . $period['end_time'], $timezone);
            while ($cursor->modify("+{$duration} minutes") <= $periodEnd) {
                $end = $cursor->modify("+{$duration} minutes");
                $startSql = $cursor->format('Y-m-d H:i:s');
                $endSql = $end->format('Y-m-d H:i:s');
                $busy = $this->overlapsRows($cursor, $end, $blocks, $date, $timezone)
                    || $this->repository->appointmentConflicts($startSql, $endSql) !== []
                    || $this->overlapsExternal($cursor, $end, $externalBusy);
                if (!$busy && $cursor > new DateTimeImmutable('now', $timezone)) {
                    $slots[] = ['start' => $cursor->format(DateTimeInterface::RFC3339), 'end' => $end->format(DateTimeInterface::RFC3339), 'label' => $cursor->format('g:i A')];
                }
                $cursor = $cursor->modify('+30 minutes');
            }
        }
        return $slots;
    }

    private function defaultBusinessScheduleForDate(string $date): array
    {
        $weekday = (int) (new DateTimeImmutable($date))->format('N');
        $weekdayNames = [
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',
            5 => 'Friday',
            6 => 'Saturday',
            7 => 'Sunday',
        ];
        $name = $weekdayNames[$weekday] ?? 'Weekday';

        if ($weekday === 7) {
            return [];
        }

        if ($weekday === 6) {
            return [[
                'kind' => 'weekday',
                'is_available' => 1,
                'start_time' => '09:00:00',
                'end_time' => '14:00:00',
                'notes' => $name . ' has a 2:00 PM cutoff.',
            ]];
        }

        return [[
            'kind' => 'weekday',
            'is_available' => 1,
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'notes' => $name . ' is open for regular business hours.',
        ]];
    }

    public function requireAvailable(array $link, string $selectedStart, array $externalBusy = []): array
    {
        $timezone = new DateTimeZone((string) ($link['timezone'] ?? $this->defaultTimezone));
        $start = new DateTimeImmutable($selectedStart, $timezone);
        foreach ($this->slots($link, $start->format('Y-m-d'), $externalBusy) as $slot) {
            if ((new DateTimeImmutable($slot['start']))->getTimestamp() === $start->getTimestamp()) return $slot;
        }
        throw new AlchemizeRequestException(409, 'SLOT_UNAVAILABLE', 'That time is no longer available. Please select another time.');
    }

    private function overlapsRows(DateTimeImmutable $start, DateTimeImmutable $end, array $blocks, string $date, DateTimeZone $timezone): bool
    {
        foreach ($blocks as $block) {
            if (empty($block['start_time']) || empty($block['end_time'])) return true;
            $blockStart = new DateTimeImmutable($date . ' ' . $block['start_time'], $timezone);
            $blockEnd = new DateTimeImmutable($date . ' ' . $block['end_time'], $timezone);
            if ($start < $blockEnd && $end > $blockStart) return true;
        }
        return false;
    }

    private function overlapsExternal(DateTimeImmutable $start, DateTimeImmutable $end, array $busy): bool
    {
        foreach ($busy as $period) {
            if (empty($period['start']) || empty($period['end'])) continue;
            if ($start < new DateTimeImmutable($period['end']) && $end > new DateTimeImmutable($period['start'])) return true;
        }
        return false;
    }
}
