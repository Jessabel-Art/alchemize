<?php

declare(strict_types=1);

final class AlchemizeExternalIntegrationService
{
    public function __construct(
        private readonly AlchemizeExternalIntegrationRepository $repository,
        private readonly ?AlchemizeGoogleDriveService $drive,
        private readonly ?AlchemizeGoogleCalendarService $calendar,
        private readonly array $config,
    ) {}

    public function ensureClientFolder(int $clientId): array
    {
        $client = $this->repository->client($clientId);
        if ($client === null) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Client was not found.');
        if (!empty($client['google_drive_folder_id'])) return ['status' => 'synchronized', 'folder_id' => $client['google_drive_folder_id']];
        if ($this->drive === null || !$this->drive->configured()) {
            // Same reasoning as synchronizeDocument()'s early-return below:
            // recording sync state must never be allowed to turn a routine
            // "not configured" result into an uncaught exception for a
            // caller further up the chain.
            try {
                $this->repository->setClientDriveState($clientId, 'not_configured', null, 'not_configured');
            } catch (Throwable $error) {
                error_log(sprintf('Failed to record Drive folder sync state [%s].', get_class($error)));
            }
            return ['status' => 'not_configured'];
        }
        try {
            $folderId = $this->drive->createClientFolder((string) $client['public_id'], (string) $client['display_name']);
            $this->repository->setClientDriveState($clientId, 'synchronized', $folderId);
            return ['status' => 'synchronized', 'folder_id' => $folderId];
        } catch (Throwable $error) {
            error_log(sprintf('Google Drive client-folder sync failed [%s].', get_class($error)));
            $this->repository->setClientDriveState($clientId, 'failed', null, 'provider_error');
            return ['status' => 'failed'];
        }
    }

    public function synchronizeDocument(int $submissionId, string $absolutePath): array
    {
        $fileId = null;
        try {
            $submission = $this->repository->submission($submissionId);
            if (!$submission) throw new RuntimeException('Document submission is missing.');
            if (!empty($submission['google_drive_file_id'])) return ['status' => 'synchronized', 'file_id' => $submission['google_drive_file_id']];
            $folder = $this->ensureClientFolder((int) $submission['client_id']);
            if (($folder['status'] ?? '') !== 'synchronized' || $this->drive === null) throw new RuntimeException('Drive storage is unavailable.');
            $fileId = $this->drive->uploadClientFile((string) $folder['folder_id'], (string) $submission['public_id'], (string) $submission['original_filename'], (string) $submission['mime_type'], $absolutePath);
            if ($fileId === '') throw new RuntimeException('Drive did not return a file identifier.');
            $this->repository->setDocumentDriveState($submissionId, 'synchronized', $fileId);
            $this->repository->setCanonicalDocumentStorage($submissionId, 'drive/' . $fileId);
            return ['status' => 'synchronized', 'file_id' => $fileId];
        } catch (Throwable $error) {
            if ($fileId) $this->discardDocumentUpload($fileId);
            error_log(sprintf('Required Drive upload failed for submission %d [%s, code %s].', $submissionId, get_class($error), $error->getCode()));
            throw new AlchemizeRequestException(503, 'DOCUMENT_STORAGE_UNAVAILABLE', 'Your file could not be saved to secure document storage. Please try again.');
        }
    }

    public function discardDocumentUpload(string $fileId): void
    {
        try { $this->drive?->trashFile($fileId); }
        catch (Throwable $error) {
            error_log(sprintf('Drive rollback cleanup requires retry for file %s [%s, code %s].', $fileId, get_class($error), $error->getCode()));
        }
    }

    public function synchronizeAppointment(int $appointmentId): array
    {
        $appointment = $this->repository->appointment($appointmentId);
        if ($appointment === null) return ['status' => 'failed'];
        if (!in_array((string) $appointment['status'], ['confirmed', 'cancelled'], true) && empty($appointment['google_calendar_event_id'])) return ['status' => 'pending'];
        if ($this->calendar === null || !$this->calendar->configured()) {
            $this->repository->setCalendarState($appointmentId, 'not_configured', null, 'not_configured');
            return ['status' => 'not_configured'];
        }
        try {
            $calendarResult = $this->calendar->synchronizeAppointment($appointment);
            $this->repository->setCalendarState(
                $appointmentId,
                'synchronized',
                $calendarResult['event_id'],
                null,
                $calendarResult['meeting_url'],
                (bool) ($calendarResult['clear_meeting_url'] ?? false),
            );
            return ['status' => 'synchronized', 'meeting_url' => $calendarResult['meeting_url']];
        } catch (Throwable $error) {
            // Temporary diagnostic instrumentation: the real Throwable is
            // otherwise swallowed here and only a generic ['status' =>
            // 'failed'] (or a sanitized CALENDAR_UNAVAILABLE, for the
            // strict availability path below) reaches the client and the
            // outer request-level logger never sees it.
            alchemize_runtime_error_log('portal/appointments/{id}/confirm (calendar sync)', $error, ['appointment_id' => $appointmentId]);
            $this->repository->setCalendarState($appointmentId, 'failed', null, 'provider_error');
            return ['status' => 'failed'];
        }
    }

    public function appointmentBusyPeriods(string $date, string $timezone, bool $strict = false): array
    {
        if ($this->calendar === null || !$this->calendar->configured()) return [];
        try {
            $zone = new DateTimeZone($timezone);
            $start = new DateTimeImmutable($date . ' 00:00:00', $zone);
            return $this->calendar->busyPeriods($start, $start->modify('+1 day'), $timezone);
        } catch (Throwable $error) {
            // Temporary diagnostic instrumentation: without this, the real
            // exception (TLS/auth/provider) is discarded the moment it is
            // converted into the sanitized CALENDAR_UNAVAILABLE response.
            alchemize_runtime_error_log('portal/appointments/availability', $error, ['date' => $date, 'timezone' => $timezone, 'strict' => $strict]);
            if ($strict) throw new AlchemizeRequestException(503, 'CALENDAR_UNAVAILABLE', 'Calendar availability is temporarily unavailable. Please try again or request another time.');
            return [];
        }
    }
}

function alchemize_external_integrations(PDO $database, array $config): AlchemizeExternalIntegrationService
{
    $factory = new AlchemizeGoogleClientFactory($config['google'] ?? []);
    return new AlchemizeExternalIntegrationService(
        new AlchemizeExternalIntegrationRepository($database),
        new AlchemizeGoogleDriveService($factory, $config['google'] ?? []),
        new AlchemizeGoogleCalendarService($factory, $config['google'] ?? []),
        $config,
    );
}
