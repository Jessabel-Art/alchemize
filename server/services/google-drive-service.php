<?php

declare(strict_types=1);

final class AlchemizeGoogleDriveService
{
    public function __construct(
        private readonly AlchemizeGoogleClientFactory $clients,
        private readonly array $config,
        private readonly ?Google\Service\Drive $gateway = null,
    ) {}

    public function verifyConnection(): array
    {
        $drive = $this->drive();
        $folder = $drive->files->get((string) $this->config['client_root_folder_id'], [
            'fields' => 'id,mimeType,trashed,capabilities(canAddChildren)',
            'supportsAllDrives' => true,
        ]);
        if ($folder->getMimeType() !== 'application/vnd.google-apps.folder' || $folder->getTrashed() || !$folder->getCapabilities()?->getCanAddChildren()) {
            throw new RuntimeException('The configured Google Drive root is not an accessible writable folder.');
        }

        return ['connected' => true, 'root_folder_accessible' => true];
    }

    public function configured(): bool
    {
        return trim((string) ($this->config['client_root_folder_id'] ?? '')) !== '';
    }

    public function createClientFolder(string $clientPublicId, string $displayName): string
    {
        $drive = $this->drive();
        $escaped = str_replace(["\\", "'"], ["\\\\", "\\'"], $clientPublicId);
        $existing = $drive->files->listFiles([
            'q' => "trashed = false and mimeType = 'application/vnd.google-apps.folder' and '" .
                (string) $this->config['client_root_folder_id'] . "' in parents and appProperties has { key='alchemizeClientId' and value='{$escaped}' }",
            'fields' => 'files(id)', 'pageSize' => 1, 'supportsAllDrives' => true, 'includeItemsFromAllDrives' => true,
        ]);
        if (count($existing->getFiles()) > 0) return (string) $existing->getFiles()[0]->getId();
        $folder = new Google\Service\Drive\DriveFile([
            'name' => $displayName . ' — ' . $clientPublicId,
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => [(string) $this->config['client_root_folder_id']],
            'appProperties' => ['alchemizeClientId' => $clientPublicId],
        ]);
        return (string) $drive->files->create($folder, ['fields' => 'id', 'supportsAllDrives' => true])->getId();
    }

    public function uploadClientFile(string $folderId, string $submissionPublicId, string $name, string $mimeType, string $absolutePath): string
    {
        $drive = $this->drive();
        $escaped = str_replace(["\\", "'"], ["\\\\", "\\'"], $submissionPublicId);
        $existing = $drive->files->listFiles([
            'q' => "trashed = false and '{$folderId}' in parents and appProperties has { key='alchemizeSubmissionId' and value='{$escaped}' }",
            'fields' => 'files(id)', 'pageSize' => 1, 'supportsAllDrives' => true, 'includeItemsFromAllDrives' => true,
        ]);
        if (count($existing->getFiles()) > 0) return (string) $existing->getFiles()[0]->getId();
        $metadata = new Google\Service\Drive\DriveFile([
            'name' => $name, 'parents' => [$folderId],
            'appProperties' => ['alchemizeSubmissionId' => $submissionPublicId],
        ]);
        $created = $drive->files->create($metadata, [
            'data' => file_get_contents($absolutePath), 'mimeType' => $mimeType,
            'uploadType' => 'multipart', 'fields' => 'id', 'supportsAllDrives' => true,
        ]);
        return (string) $created->getId();
    }

    private function drive(): Google\Service\Drive
    {
        if ($this->gateway !== null) return $this->gateway;
        if (!$this->configured()) throw new RuntimeException('Google Drive is not configured.');
        if (!class_exists('Google\\Service\\Drive')) throw new RuntimeException('The Google Drive service library is not installed.');
        return new Google\Service\Drive($this->clients->create(['https://www.googleapis.com/auth/drive']));
    }

    public function readFile(string $fileId): string
    {
        $response = $this->drive()->files->get($fileId, ['alt' => 'media', 'supportsAllDrives' => true]);
        return (string) $response->getBody();
    }

    // Compensate only a file created for an upload whose database transaction failed.
    public function trashFile(string $fileId): void
    {
        $this->drive()->files->update($fileId, new Google\Service\Drive\DriveFile(['trashed' => true]), ['supportsAllDrives' => true]);
    }
}
