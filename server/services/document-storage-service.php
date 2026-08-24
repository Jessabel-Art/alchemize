<?php

declare(strict_types=1);

final class AlchemizeDocumentStorageService
{
    private const MAXIMUM_BYTES = 15 * 1024 * 1024;
    private const ALLOWED_TYPES = [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
    ];

    public function __construct(private readonly string $root) {}

    public function store(array $file, int $clientId, int $documentId, int $versionNumber, ?int $engagementId = null): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !isset($file['tmp_name'])) {
            throw new AlchemizeRequestException(422, 'UPLOAD_REQUIRED', 'Select a valid file to upload.');
        }
        $size = (int) ($file['size'] ?? 0);
        if ($size < 1 || $size > self::MAXIMUM_BYTES) {
            throw new AlchemizeRequestException(422, 'UPLOAD_SIZE_INVALID', 'Files must be no larger than 15 MB.');
        }
        $temporaryPath = (string) $file['tmp_name'];
        if (!is_uploaded_file($temporaryPath)) {
            throw new AlchemizeRequestException(422, 'UPLOAD_INVALID', 'The uploaded file could not be verified.');
        }
        $mimeType = $this->detectMimeType($temporaryPath);
        $extension = self::ALLOWED_TYPES[$mimeType] ?? null;
        if ($extension === null) {
            throw new AlchemizeRequestException(422, 'UPLOAD_TYPE_INVALID', 'This file type is not supported.');
        }
        $originalName = trim(basename((string) ($file['name'] ?? 'document')));
        $originalExtension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $permittedExtensions = $extension === 'jpg' ? ['jpg', 'jpeg'] : [$extension];
        if (!in_array($originalExtension, $permittedExtensions, true)) {
            throw new AlchemizeRequestException(422, 'UPLOAD_EXTENSION_INVALID', 'The filename extension does not match the file content.');
        }

        $engagementSegment = $engagementId ?? 0;
        $directory = rtrim($this->root, '/\\') . DIRECTORY_SEPARATOR . $clientId
            . DIRECTORY_SEPARATOR . $engagementSegment . DIRECTORY_SEPARATOR . $documentId
            . DIRECTORY_SEPARATOR . 'v' . $versionNumber;
        if ((!is_dir($directory) && !mkdir($directory, 0700, true)) || !is_writable($directory)) {
            throw new RuntimeException('Private document storage is not writable.');
        }
        $storageName = bin2hex(random_bytes(24)) . '.' . $extension;
        $path = $directory . DIRECTORY_SEPARATOR . $storageName;
        if (!move_uploaded_file($temporaryPath, $path)) {
            throw new RuntimeException('The uploaded document could not be stored.');
        }
        @chmod($path, 0600);

        return [
            'original_filename' => function_exists('mb_substr') ? mb_substr($originalName, 0, 255) : substr($originalName, 0, 255),
            'storage_key' => implode('/', [$clientId, $engagementSegment, $documentId, 'v' . $versionNumber, $storageName]),
            'mime_type' => $mimeType,
            'file_extension' => $extension,
            'file_size_bytes' => $size,
            'sha256' => hash_file('sha256', $path),
            'absolute_path' => $path,
        ];
    }

    public function discard(string $absolutePath): void
    {
        if ($absolutePath !== '' && is_file($absolutePath)) @unlink($absolutePath);
    }

    private function detectMimeType(string $path): string
    {
        if (class_exists('finfo')) {
            $detector = new finfo(FILEINFO_MIME_TYPE);
            return (string) $detector->file($path);
        }
        $header = file_get_contents($path, false, null, 0, 16);
        if (!is_string($header)) return '';
        if (str_starts_with($header, '%PDF-')) return 'application/pdf';
        if (str_starts_with($header, "\xFF\xD8\xFF")) return 'image/jpeg';
        if (str_starts_with($header, "\x89PNG\r\n\x1A\n")) return 'image/png';
        if (substr($header, 0, 4) === 'RIFF' && substr($header, 8, 4) === 'WEBP') return 'image/webp';
        if (str_starts_with($header, "PK\x03\x04") && class_exists('ZipArchive')) {
            $archive = new ZipArchive();
            if ($archive->open($path) === true) {
                $type = $archive->locateName('word/document.xml') !== false
                    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    : ($archive->locateName('xl/workbook.xml') !== false
                        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : '');
                $archive->close();
                return $type;
            }
        }
        return '';
    }

    public function sendPrivateFile(string $storageKey, string $downloadName, string $mimeType): never
    {
        $legacyKey = preg_match('#^[0-9]+/[a-f0-9]{48}\.[a-z0-9]+$#', $storageKey) === 1;
        $versionedKey = preg_match('#^[0-9]+/[0-9]+/[0-9]+/v[1-9][0-9]*/[a-f0-9]{48}\.[a-z0-9]+$#', $storageKey) === 1;
        if (!$legacyKey && !$versionedKey) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested file was not found.');
        }
        $root = realpath($this->root);
        $path = realpath(rtrim($this->root, '/\\') . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $storageKey));
        if ($root === false || $path === false || !str_starts_with($path, $root . DIRECTORY_SEPARATOR) || !is_file($path)) {
            throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested file was not found.');
        }
        $safeName = preg_replace('/[^A-Za-z0-9._ -]/', '_', basename($downloadName)) ?: 'document';
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($path));
        header('Content-Disposition: attachment; filename="' . addcslashes($safeName, '"\\') . '"');
        header('Cache-Control: private, no-store');
        header('X-Content-Type-Options: nosniff');
        readfile($path);
        exit;
    }
}
