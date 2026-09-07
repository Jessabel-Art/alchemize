<?php

declare(strict_types=1);

final class AlchemizeSystemIntegrationsService
{
    public function __construct(
        private readonly PDO $database,
        private readonly array $config,
    ) {}

    public function summary(): array
    {
        return [
            'generated_at' => gmdate('c'),
            'integrations' => [
                'resend' => $this->resendStatus(),
                'stripe' => $this->stripeStatus(),
                'google_calendar' => $this->googleCalendarStatus(),
                'google_drive' => $this->googleDriveStatus(),
            ],
            'system' => [
                'database' => $this->databaseStatus(),
                'application' => $this->applicationStatus(),
            ],
        ];
    }

    public function healthCheck(string $slug): array
    {
        return match (strtolower($slug)) {
            'resend' => $this->resendStatus(),
            'stripe' => $this->stripeStatus(),
            'google-calendar', 'google_calendar', 'calendar' => $this->googleCalendarStatus(),
            'google-drive', 'google_drive', 'drive' => $this->googleDriveStatus(),
            'database' => $this->databaseStatus(),
            default => [
                'name' => ucfirst(str_replace(['-', '_'], ' ', $slug)),
                'provider' => strtolower($slug),
                'status' => 'Unknown',
                'configured' => false,
                'last_success' => null,
                'last_error' => null,
                'details' => 'No safe status check is available for this integration in this phase.',
            ],
        };
    }

    private function resendStatus(): array
    {
        $configured = trim((string) ($this->config['resend']['api_key'] ?? '')) !== ''
            && filter_var((string) ($this->config['resend']['from_email'] ?? ''), FILTER_VALIDATE_EMAIL) !== false
            && trim((string) ($this->config['resend']['from_name'] ?? '')) !== '';
        $lastSuccess = $this->singleValue(
            'SELECT delivered_at FROM notifications WHERE delivery_status = :status ORDER BY delivered_at DESC LIMIT 1',
            ['status' => 'sent'],
        );
        $lastError = $this->singleValue(
            'SELECT delivery_error FROM notifications WHERE delivery_status IN (:failed, :unavailable) ORDER BY delivery_attempted_at DESC LIMIT 1',
            ['failed' => 'failed', 'unavailable' => 'unavailable'],
        );

        $status = 'Not configured';
        if ($configured && $lastError !== null && $lastSuccess === null) {
            $status = 'Error';
        } elseif ($configured && $lastError !== null) {
            $status = 'Degraded';
        } elseif ($configured && $lastSuccess !== null) {
            $status = 'Connected';
        } elseif ($configured) {
            $status = 'Configured';
        }

        return [
            'name' => 'Resend',
            'provider' => 'resend',
            'status' => $status,
            'configured' => $configured,
            'last_success' => $lastSuccess,
            'last_error' => $this->sanitizeErrorSummary((string) ($lastError ?? '')),
            'details' => $configured
                ? 'Email provider configuration is present and only safe activity metadata is reported.'
                : 'Resend is not configured in the app environment.',
        ];
    }

    private function stripeStatus(): array
    {
        $configured = trim((string) ($this->config['stripe']['secret_key'] ?? '')) !== ''
            || trim((string) ($this->config['stripe']['webhook_secret'] ?? '')) !== '';
        $lastWebhook = $this->singleValue(
            'SELECT created_at FROM stripe_webhook_events ORDER BY created_at DESC LIMIT 1',
        );
        $lastError = $this->singleValue(
            'SELECT created_at FROM stripe_webhook_events WHERE event_status = :status ORDER BY created_at DESC LIMIT 1',
            ['status' => 'failed'],
        );
        $lastWebhookType = $this->singleValue(
            'SELECT event_type FROM stripe_webhook_events ORDER BY created_at DESC LIMIT 1',
        );

        $status = 'Not configured';
        if ($configured && $lastError !== null) {
            $status = 'Degraded';
        } elseif ($configured && $lastWebhook !== null) {
            $status = 'Connected';
        } elseif ($configured) {
            $status = 'Configured';
        }

        return [
            'name' => 'Stripe',
            'provider' => 'stripe',
            'status' => $status,
            'configured' => $configured,
            'mode' => trim((string) ($this->config['stripe']['secret_key'] ?? '')) !== '' && str_contains((string) getenv('APP_ENV'), 'prod') ? 'live' : 'test',
            'last_success' => $lastWebhook,
            'last_webhook_type' => $lastWebhookType,
            'last_error' => $lastError !== null ? 'A recent Stripe webhook was marked failed or not processed.' : null,
            'details' => $configured
                ? 'Stripe is configured; webhook and sync metadata remain visible without exposing credentials.'
                : 'Stripe is not configured for this environment.',
        ];
    }

    private function googleCalendarStatus(): array
    {
        $configured = trim((string) ($this->config['google']['calendar_id'] ?? '')) !== '';
        $lastSuccess = $this->singleValue(
            'SELECT calendar_synced_at FROM appointments WHERE calendar_sync_status = :status AND calendar_synced_at IS NOT NULL ORDER BY calendar_synced_at DESC LIMIT 1',
            ['status' => 'synchronized'],
        );
        $lastError = $this->singleValue(
            'SELECT calendar_sync_error FROM appointments WHERE calendar_sync_status = :status AND calendar_sync_error IS NOT NULL ORDER BY calendar_sync_attempted_at DESC LIMIT 1',
            ['status' => 'failed'],
        );
        $configuredCalendar = trim((string) ($this->config['google']['calendar_id'] ?? '')) !== ''
            ? (string) $this->config['google']['calendar_id']
            : null;

        $status = 'Not configured';
        if ($configured && $lastError !== null) {
            $status = 'Degraded';
        } elseif ($configured && $lastSuccess !== null) {
            $status = 'Connected';
        } elseif ($configured) {
            $status = 'Configured';
        }

        return [
            'name' => 'Google Calendar',
            'provider' => 'google_calendar',
            'status' => $status,
            'configured' => $configured,
            'calendar_id' => $configuredCalendar,
            'last_success' => $lastSuccess,
            'last_error' => $this->sanitizeErrorSummary((string) ($lastError ?? '')),
            'details' => $configured
                ? 'Google Calendar access is configured and only sanitized sync status is returned.'
                : 'Google Calendar is not configured for this environment.',
        ];
    }

    private function googleDriveStatus(): array
    {
        $configured = trim((string) ($this->config['google']['client_root_folder_id'] ?? '')) !== '';
        $lastSuccess = $this->singleValue(
            'SELECT drive_synced_at FROM document_submissions WHERE drive_sync_status = :status AND drive_synced_at IS NOT NULL ORDER BY drive_synced_at DESC LIMIT 1',
            ['status' => 'synchronized'],
        );
        $lastError = $this->singleValue(
            'SELECT drive_sync_error FROM document_submissions WHERE drive_sync_status = :status AND drive_sync_error IS NOT NULL ORDER BY drive_sync_attempted_at DESC LIMIT 1',
            ['status' => 'failed'],
        );
        $configuredFolder = trim((string) ($this->config['google']['client_root_folder_id'] ?? '')) !== ''
            ? (string) $this->config['google']['client_root_folder_id']
            : null;

        $status = 'Not configured';
        if ($configured && $lastError !== null) {
            $status = 'Degraded';
        } elseif ($configured && $lastSuccess !== null) {
            $status = 'Connected';
        } elseif ($configured) {
            $status = 'Configured';
        }

        return [
            'name' => 'Google Drive',
            'provider' => 'google_drive',
            'status' => $status,
            'configured' => $configured,
            'root_folder_id' => $configuredFolder,
            'last_success' => $lastSuccess,
            'last_error' => $this->sanitizeErrorSummary((string) ($lastError ?? '')),
            'details' => $configured
                ? 'Google Drive is configured and only safe folder and sync metadata are reported.'
                : 'Google Drive is not configured for this environment.',
        ];
    }

    private function databaseStatus(): array
    {
        try {
            $value = $this->singleValue('SELECT 1');
            $connected = $value === '1';
            return [
                'name' => 'Database',
                'status' => $connected ? 'Connected' : 'Error',
                'configured' => true,
                'last_success' => $connected ? gmdate('c') : null,
                'last_error' => $connected ? null : 'Database connection check failed.',
                'details' => 'Minimal database connectivity check passed without exposing connection details.',
            ];
        } catch (Throwable) {
            return [
                'name' => 'Database',
                'status' => 'Error',
                'configured' => true,
                'last_success' => null,
                'last_error' => 'Database connection check failed.',
                'details' => 'Minimal database connectivity check failed without exposing credentials.',
            ];
        }
    }

    private function applicationStatus(): array
    {
        $packagePath = dirname(__DIR__, 2) . '/package.json';
        $version = 'Unknown';
        if (is_file($packagePath)) {
            $decoded = json_decode((string) file_get_contents($packagePath), true);
            if (is_array($decoded) && isset($decoded['version']) && is_string($decoded['version'])) {
                $version = $decoded['version'];
            }
        }

        $build = getenv('ALCHEMIZE_BUILD_SHA') ?: getenv('GITHUB_SHA') ?: null;
        $deployedAt = getenv('ALCHEMIZE_DEPLOYED_AT') ?: null;
        $environment = (string) ($this->config['app_env'] ?? getenv('ALCHEMIZE_APP_ENV') ?: 'production');

        return [
            'name' => 'Application',
            'version' => $version,
            'build' => $build,
            'environment' => $environment,
            'runtime' => PHP_VERSION,
            'deployed_at' => $deployedAt,
            'details' => 'Version and runtime metadata are displayed only when reliably available from project configuration.',
        ];
    }

    private function sanitizeErrorSummary(string $input): ?string
    {
        $value = trim($input);
        if ($value === '') return null;
        $normalized = str_replace(['_', '-'], ' ', $value);
        $normalized = preg_replace('/\s+/', ' ', $normalized) ?: $value;
        $map = [
            'missing resend configuration' => 'Resend is not fully configured.',
            'provider exception' => 'The provider returned an unexpected error.',
            'resend request failed' => 'The provider request failed.',
            'resend rejected request' => 'The provider rejected the request.',
            'not configured' => 'The integration is not configured.',
            'provider error' => 'A provider error was recorded.',
            'rate limit exceeded' => 'Provider rate limit exceeded.',
            'authentication failed' => 'Authentication failed.',
            'unauthorized' => 'Authentication failed.',
        ];
        foreach ($map as $needle => $replacement) {
            if (stripos($normalized, $needle) !== false) {
                return $replacement;
            }
        }
        return ucfirst($normalized);
    }

    private function singleValue(string $sql, array $params = []): ?string
    {
        $statement = $this->database->prepare($sql);
        $statement->execute($params);
        $value = $statement->fetchColumn();
        if ($value === false || $value === null || trim((string) $value) === '') {
            return null;
        }
        return (string) $value;
    }
}
