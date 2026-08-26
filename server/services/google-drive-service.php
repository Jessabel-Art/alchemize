<?php

declare(strict_types=1);

final class AlchemizeGoogleDriveService
{
    public function __construct(
        private readonly AlchemizeGoogleClientFactory $clients,
        private readonly array $config,
    ) {}

    public function verifyConnection(): array
    {
        $client = $this->clients->create(['https://www.googleapis.com/auth/drive']);
        if (!class_exists('Google\\Service\\Drive')) {
            throw new RuntimeException('The Google Drive service library is not installed.');
        }

        $drive = new Google\Service\Drive($client);
        $folder = $drive->files->get((string) $this->config['client_root_folder_id'], [
            'fields' => 'id,mimeType',
            'supportsAllDrives' => true,
        ]);
        if ($folder->getMimeType() !== 'application/vnd.google-apps.folder') {
            throw new RuntimeException('The configured Google Drive root is not a folder.');
        }

        return ['connected' => true, 'root_folder_accessible' => true];
    }
}
