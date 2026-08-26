<?php

declare(strict_types=1);

final class AlchemizeGoogleClientFactory
{
    public function __construct(private readonly array $config) {}

    public function configurationStatus(): array
    {
        $path = (string) ($this->config['credentials_path'] ?? '');
        return [
            'project_id' => trim((string) ($this->config['project_id'] ?? '')) !== '',
            'service_account_email' => filter_var($this->config['service_account_email'] ?? '', FILTER_VALIDATE_EMAIL) !== false,
            'credentials_path' => $path !== '' && is_file($path),
            'client_root_folder_id' => trim((string) ($this->config['client_root_folder_id'] ?? '')) !== '',
            'calendar_id' => trim((string) ($this->config['calendar_id'] ?? '')) !== '',
            'google_sdk' => class_exists(\Google\Client::class),
            'openssl' => extension_loaded('openssl'),
            'curl' => extension_loaded('curl'),
        ];
    }

    public function loadCredentialDocument(): array
    {
        $path = (string) ($this->config['credentials_path'] ?? '');
        if ($path === '' || !is_file($path)) {
            throw new RuntimeException('Google credentials are not configured.');
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            throw new RuntimeException('Google credentials could not be read.');
        }

        try {
            $credentials = json_decode($contents, true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException $error) {
            throw new RuntimeException('Google credentials are invalid.', 0, $error);
        }

        foreach (['type', 'project_id', 'private_key', 'client_email'] as $field) {
            if (!is_array($credentials) || trim((string) ($credentials[$field] ?? '')) === '') {
                throw new RuntimeException('Google credentials are incomplete.');
            }
        }
        if (($credentials['type'] ?? '') !== 'service_account') {
            throw new RuntimeException('Google credentials must describe a service account.');
        }

        return $credentials;
    }

    public function create(array $scopes): object
    {
        $this->loadCredentialDocument();
        if (!class_exists(\Google\Client::class)) {
            throw new RuntimeException('The Google API client is not installed.');
        }
        if (!extension_loaded('openssl') || !extension_loaded('curl')) {
            throw new RuntimeException('Required PHP extensions for Google authentication are unavailable.');
        }

        $client = new Google\Client();
        $client->setAuthConfig((string) $this->config['credentials_path']);
        $client->setScopes($scopes);
        $client->setApplicationName('Alchemize Business Services');
        return $client;
    }
}
