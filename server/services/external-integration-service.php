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
            $this->repository->setClientDriveState($clientId, 'not_configured', null, 'not_configured');
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
        $submission = $this->repository->submission($submissionId);
        if ($submission === null) return ['status' => 'failed'];
        if (!empty($submission['google_drive_file_id'])) return ['status' => 'synchronized'];
        $folder = $this->ensureClientFolder((int) $submission['client_id']);
        if (($folder['status'] ?? '') !== 'synchronized' || $this->drive === null) {
            $status = ($folder['status'] ?? '') === 'not_configured' ? 'not_configured' : 'failed';
            $this->repository->setDocumentDriveState($submissionId, $status, null, $status);
            return ['status' => $status];
        }
        try {
            $fileId = $this->drive->uploadClientFile(
                (string) $folder['folder_id'], (string) $submission['public_id'],
                (string) $submission['original_filename'], (string) $submission['mime_type'], $absolutePath,
            );
            $this->repository->setDocumentDriveState($submissionId, 'synchronized', $fileId);
            return ['status' => 'synchronized'];
        } catch (Throwable $error) {
            error_log(sprintf('Google Drive document sync failed [%s].', get_class($error)));
            $this->repository->setDocumentDriveState($submissionId, 'failed', null, 'provider_error');
            return ['status' => 'failed'];
        }
    }

    public function synchronizeAppointment(int $appointmentId): array
    {
        $appointment = $this->repository->appointment($appointmentId);
        if ($appointment === null) return ['status' => 'failed'];
        if (!in_array((string) $appointment['status'], ['confirmed', 'cancelled'], true)) return ['status' => 'pending'];
        if ($this->calendar === null || !$this->calendar->configured()) {
            $this->repository->setCalendarState($appointmentId, 'not_configured', null, 'not_configured');
            return ['status' => 'not_configured'];
        }
        try {
            $calendarResult = $this->calendar->synchronizeAppointment($appointment);
            $this->repository->setCalendarState($appointmentId, 'synchronized', $calendarResult['event_id'], null, $calendarResult['meeting_url']);
            return ['status' => 'synchronized', 'meeting_url' => $calendarResult['meeting_url']];
        } catch (Throwable $error) {
            error_log(sprintf('Google Calendar appointment sync failed [%s].', get_class($error)));
            $this->repository->setCalendarState($appointmentId, 'failed', null, 'provider_error');
            return ['status' => 'failed'];
        }
    }

    public function appointmentBusyPeriods(string $date, string $timezone): array
    {
        if ($this->calendar === null || !$this->calendar->configured()) return [];
        try {
            $zone = new DateTimeZone($timezone);
            $start = new DateTimeImmutable($date . ' 00:00:00', $zone);
            return $this->calendar->busyPeriods($start, $start->modify('+1 day'), $timezone);
        } catch (Throwable $error) {
            error_log(sprintf('Google Calendar busy-period lookup failed [%s].', get_class($error)));
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
