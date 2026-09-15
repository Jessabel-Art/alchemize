<?php

declare(strict_types=1);

// System & Integrations: report REAL, current provider health rather than
// inferring "Connected" from the mere presence of configuration. Configured
// means the app has the required credentials; Connected means a real
// provider request (an explicit "Check Connection" click, or genuine
// business activity like a sent email or a synced calendar event) actually
// succeeded. Connection-check outcomes are persisted as audit_events rows
// (event_type integration.check.success|error, entity_type=integration,
// entity_id=<provider slug>) -- the same generic, already-existing audit
// log Data Maintenance uses -- rather than a second, competing
// integration-state table.
final class AlchemizeSystemIntegrationsService
{
    private const CHECK_SUCCESS = 'integration.check.success';
    private const CHECK_ERROR = 'integration.check.error';

    public function __construct(
        private readonly PDO $database,
        private readonly array $config,
        private readonly ?int $actorUserId = null,
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

    // Performs a REAL, provider-specific, read-only connection check and
    // records the outcome, then returns the refreshed status for that
    // provider (folding the just-recorded result back in immediately, so
    // the caller does not need a second round trip).
    public function healthCheck(string $slug): array
    {
        $provider = strtolower($slug);
        return match ($provider) {
            'resend' => $this->checkResend(),
            'stripe' => $this->checkStripe(),
            'google-calendar', 'google_calendar', 'calendar' => $this->checkGoogleCalendar(),
            'google-drive', 'google_drive', 'drive' => $this->checkGoogleDrive(),
            'database' => $this->databaseStatus(),
            default => [
                'name' => ucfirst(str_replace(['-', '_'], ' ', $slug)),
                'provider' => $provider,
                'status' => 'Unknown',
                'configured' => false,
                'last_check' => null,
                'last_success' => null,
                'last_error' => null,
                'details' => 'No safe status check is available for this integration.',
            ],
        };
    }

    // ---- Resend --------------------------------------------------------

    private function resendStatus(): array
    {
        $configured = trim((string) ($this->config['resend']['api_key'] ?? '')) !== ''
            && filter_var((string) ($this->config['resend']['from_email'] ?? ''), FILTER_VALIDATE_EMAIL) !== false
            && trim((string) ($this->config['resend']['from_name'] ?? '')) !== '';
        $activitySuccess = $this->singleValue(
            'SELECT delivered_at FROM notifications WHERE delivery_status = :status ORDER BY delivered_at DESC LIMIT 1',
            ['status' => 'sent'],
        );
        $activityErrorRow = $this->one(
            'SELECT delivery_attempted_at AS at, delivery_error AS message FROM notifications WHERE delivery_status IN (:failed, :unavailable) ORDER BY delivery_attempted_at DESC LIMIT 1',
            ['failed' => 'failed', 'unavailable' => 'unavailable'],
        );
        return $this->composeStatus('Resend', 'resend', $configured, $activitySuccess, $activityErrorRow, [
            'details' => $configured
                ? 'Email provider configuration is present and only safe activity metadata is reported.'
                : 'Resend is not configured in the app environment.',
        ]);
    }

    private function checkResend(): array
    {
        $configured = trim((string) ($this->config['resend']['api_key'] ?? '')) !== ''
            && filter_var((string) ($this->config['resend']['from_email'] ?? ''), FILTER_VALIDATE_EMAIL) !== false
            && trim((string) ($this->config['resend']['from_name'] ?? '')) !== '';
        if (!$configured) {
            return $this->resendStatus();
        }
        try {
            (new AlchemizeResendEmailProvider($this->config['resend'] ?? []))->verifyConnection();
            $this->recordCheck('resend', true, null);
        } catch (Throwable $error) {
            $this->recordCheck('resend', false, $this->classifyProviderError($error));
        }
        return $this->resendStatus();
    }

    // ---- Stripe ----------------------------------------------------------

    private function stripeStatus(): array
    {
        $configured = trim((string) ($this->config['stripe']['secret_key'] ?? '')) !== ''
            || trim((string) ($this->config['stripe']['webhook_secret'] ?? '')) !== '';
        $activitySuccess = $this->singleValue('SELECT created_at FROM stripe_webhook_events ORDER BY created_at DESC LIMIT 1');
        $activityErrorRow = $this->one(
            "SELECT created_at AS at, 'A recent Stripe webhook was marked failed or not processed.' AS message FROM stripe_webhook_events WHERE event_status = :status ORDER BY created_at DESC LIMIT 1",
            ['status' => 'failed'],
        );
        $status = $this->composeStatus('Stripe', 'stripe', $configured, $activitySuccess, $activityErrorRow, [
            'mode' => trim((string) ($this->config['stripe']['secret_key'] ?? '')) !== '' && str_contains((string) getenv('APP_ENV'), 'prod') ? 'live' : 'test',
            'details' => $configured
                ? 'Stripe is configured; webhook and sync metadata remain visible without exposing credentials.'
                : 'Stripe is not configured for this environment.',
        ]);
        $status['last_webhook_type'] = $this->singleValue('SELECT event_type FROM stripe_webhook_events ORDER BY created_at DESC LIMIT 1');
        return $status;
    }

    private function checkStripe(): array
    {
        $secretKey = trim((string) ($this->config['stripe']['secret_key'] ?? ''));
        if ($secretKey === '') {
            return $this->stripeStatus();
        }
        try {
            (new AlchemizeStripeHttpGateway($secretKey))->verifyConnection();
            $this->recordCheck('stripe', true, null);
        } catch (AlchemizeStripeAuthenticationError) {
            $this->recordCheck('stripe', false, 'credentials rejected');
        } catch (Throwable $error) {
            $this->recordCheck('stripe', false, $this->classifyProviderError($error));
        }
        return $this->stripeStatus();
    }

    // ---- Google Calendar ---------------------------------------------------

    private function googleCalendarStatus(): array
    {
        $configured = trim((string) ($this->config['google']['calendar_id'] ?? '')) !== '';
        $activitySuccess = $this->singleValue(
            'SELECT calendar_synced_at FROM appointments WHERE calendar_sync_status = :status AND calendar_synced_at IS NOT NULL ORDER BY calendar_synced_at DESC LIMIT 1',
            ['status' => 'synchronized'],
        );
        $activityErrorRow = $this->one(
            'SELECT calendar_sync_attempted_at AS at, calendar_sync_error AS message FROM appointments WHERE calendar_sync_status = :status AND calendar_sync_error IS NOT NULL ORDER BY calendar_sync_attempted_at DESC LIMIT 1',
            ['status' => 'failed'],
        );
        $status = $this->composeStatus('Google Calendar', 'google_calendar', $configured, $activitySuccess, $activityErrorRow, [
            'calendar_id' => $configured ? (string) $this->config['google']['calendar_id'] : null,
            'details' => $configured
                ? 'Google Calendar access is configured and only sanitized sync status is returned.'
                : 'Google Calendar is not configured for this environment.',
        ]);
        // Meet capability can only be known from an actual Calendar API
        // response (conferenceProperties.allowedConferenceSolutionTypes),
        // not inferred from configuration -- read it back from the last
        // successful check's recorded metadata rather than re-checking on
        // every page load.
        $metadata = $this->auditLastMetadata('google_calendar', self::CHECK_SUCCESS);
        $status['calendar_accessible'] = $status['status'] === 'Connected' ? true : ($configured ? null : false);
        $status['meet_capable'] = $metadata['meet_capable'] ?? null;
        return $status;
    }

    private function checkGoogleCalendar(): array
    {
        $configured = trim((string) ($this->config['google']['calendar_id'] ?? '')) !== '';
        if (!$configured) {
            return $this->googleCalendarStatus();
        }
        try {
            $factory = new AlchemizeGoogleClientFactory($this->config['google'] ?? []);
            $result = (new AlchemizeGoogleCalendarService($factory, $this->config['google'] ?? []))->verifyConnection();
            $this->recordCheck('google_calendar', true, null, ['meet_capable' => (bool) ($result['meet_capable'] ?? false)]);
        } catch (Throwable $error) {
            $this->recordCheck('google_calendar', false, $this->classifyGoogleError($error));
        }
        return $this->googleCalendarStatus();
    }

    // ---- Google Drive ------------------------------------------------------

    private function googleDriveStatus(): array
    {
        $configured = trim((string) ($this->config['google']['client_root_folder_id'] ?? '')) !== '';
        $activitySuccess = $this->singleValue(
            'SELECT drive_synced_at FROM document_submissions WHERE drive_sync_status = :status AND drive_synced_at IS NOT NULL ORDER BY drive_synced_at DESC LIMIT 1',
            ['status' => 'synchronized'],
        );
        $activityErrorRow = $this->one(
            'SELECT drive_sync_attempted_at AS at, drive_sync_error AS message FROM document_submissions WHERE drive_sync_status = :status AND drive_sync_error IS NOT NULL ORDER BY drive_sync_attempted_at DESC LIMIT 1',
            ['status' => 'failed'],
        );
        return $this->composeStatus('Google Drive', 'google_drive', $configured, $activitySuccess, $activityErrorRow, [
            'root_folder_id' => $configured ? (string) $this->config['google']['client_root_folder_id'] : null,
            'details' => $configured
                ? 'Google Drive is configured and only safe folder and sync metadata are reported.'
                : 'Google Drive is not configured for this environment.',
        ]);
    }

    private function checkGoogleDrive(): array
    {
        $configured = trim((string) ($this->config['google']['client_root_folder_id'] ?? '')) !== '';
        if (!$configured) {
            return $this->googleDriveStatus();
        }
        try {
            $factory = new AlchemizeGoogleClientFactory($this->config['google'] ?? []);
            (new AlchemizeGoogleDriveService($factory, $this->config['google'] ?? []))->verifyConnection();
            $this->recordCheck('google_drive', true, null);
        } catch (Throwable $error) {
            $this->recordCheck('google_drive', false, $this->classifyGoogleError($error));
        }
        return $this->googleDriveStatus();
    }

    // ---- System / database ----------------------------------------------

    private function databaseStatus(): array
    {
        try {
            $value = $this->singleValue('SELECT 1');
            $connected = $value === '1';
            return [
                'name' => 'Database',
                'status' => $connected ? 'Connected' : 'Error',
                'configured' => true,
                'last_check' => gmdate('c'),
                'last_success' => $connected ? gmdate('c') : null,
                'last_error' => $connected ? null : 'Database connection check failed.',
                'details' => 'A real SELECT 1 query was executed on the application database; no destructive operation is ever performed.',
            ];
        } catch (Throwable) {
            return [
                'name' => 'Database',
                'status' => 'Error',
                'configured' => true,
                'last_check' => gmdate('c'),
                'last_success' => null,
                'last_error' => 'Database connection check failed.',
                'details' => 'A real SELECT 1 query failed without exposing connection details.',
            ];
        }
    }

    private function applicationStatus(): array
    {
        $packagePath = dirname(__DIR__, 2) . '/package.json';
        $version = null;
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

    // ---- Shared status composition -----------------------------------------

    // Combines a provider's real business-activity signal (e.g. a sent
    // email, a synced calendar event) with the audit-log signal from
    // explicit "Check Connection" clicks, so either kind of real success
    // can move status to Connected, and status reflects whichever of the
    // two most recently happened rather than "any error, ever".
    private function composeStatus(
        string $name,
        string $provider,
        bool $configured,
        ?string $activitySuccess,
        ?array $activityErrorRow,
        array $extra = [],
    ): array {
        $auditSuccess = $this->auditLastTimestamp($provider, self::CHECK_SUCCESS);
        $auditErrorRow = $this->auditLastError($provider);
        $lastCheckCandidates = array_filter([
            $auditSuccess,
            $auditErrorRow['at'] ?? null,
        ]);
        $lastSuccess = $this->mostRecent($activitySuccess, $auditSuccess);
        $activityError = $activityErrorRow['at'] ?? null;
        $auditError = $auditErrorRow['at'] ?? null;
        $lastError = $this->mostRecent($activityError, $auditError);
        $lastErrorMessage = $this->pickErrorMessage($activityErrorRow, $activityError, $auditErrorRow, $auditError);

        $status = 'Not configured';
        if ($configured) {
            if ($lastError !== null && ($lastSuccess === null || $lastError > $lastSuccess)) {
                $status = 'Error';
            } elseif ($lastSuccess !== null) {
                $status = 'Connected';
            } else {
                $status = 'Configured';
            }
        }

        return array_merge([
            'name' => $name,
            'provider' => $provider,
            'status' => $status,
            'configured' => $configured,
            'last_check' => $this->mostRecent($lastSuccess, $lastError) ?: ($lastCheckCandidates !== [] ? max($lastCheckCandidates) : null),
            'last_success' => $lastSuccess,
            'last_error' => $lastErrorMessage !== null ? $this->sanitizeErrorSummary($lastErrorMessage) : null,
        ], $extra);
    }

    private function pickErrorMessage(?array $activityErrorRow, ?string $activityError, ?array $auditErrorRow, ?string $auditError): ?string
    {
        if ($activityError !== null && ($auditError === null || $activityError >= $auditError)) {
            return $activityErrorRow['message'] ?? null;
        }
        return $auditErrorRow['message'] ?? null;
    }

    private function mostRecent(?string $a, ?string $b): ?string
    {
        if ($a === null) return $b;
        if ($b === null) return $a;
        return $a >= $b ? $a : $b;
    }

    // ---- Audit-log persistence (reuses the existing audit_events table,
    // the same one Data Maintenance writes to -- no competing schema) ------

    private function recordCheck(string $provider, bool $success, ?string $reason, array $metadata = []): void
    {
        if ($this->actorUserId === null) return;
        $name = ucfirst(str_replace('_', ' ', $provider));
        $summary = $success
            ? "{$name} connection check succeeded."
            : "{$name} connection check failed" . ($reason !== null ? ": {$reason}." : '.');
        $this->database->prepare(
            'INSERT INTO audit_events (public_id, actor_user_id, event_type, entity_type, entity_id, action_summary, request_metadata)
             VALUES (:public_id, :actor_user_id, :event_type, :entity_type, :entity_id, :summary, :metadata)'
        )->execute([
            'public_id' => alchemize_uuid_v4(),
            'actor_user_id' => $this->actorUserId,
            'event_type' => $success ? self::CHECK_SUCCESS : self::CHECK_ERROR,
            'entity_type' => 'integration',
            'entity_id' => $provider,
            'summary' => $summary,
            'metadata' => json_encode(array_merge(['provider' => $provider], $metadata), JSON_THROW_ON_ERROR),
        ]);
    }

    private function auditLastTimestamp(string $provider, string $eventType): ?string
    {
        return $this->singleValue(
            'SELECT created_at FROM audit_events WHERE entity_type = :entity_type AND entity_id = :provider AND event_type = :event_type ORDER BY created_at DESC LIMIT 1',
            ['entity_type' => 'integration', 'provider' => $provider, 'event_type' => $eventType],
        );
    }

    private function auditLastError(string $provider): ?array
    {
        $row = $this->one(
            'SELECT created_at AS at, action_summary AS message FROM audit_events WHERE entity_type = :entity_type AND entity_id = :provider AND event_type = :event_type ORDER BY created_at DESC LIMIT 1',
            ['entity_type' => 'integration', 'provider' => $provider, 'event_type' => self::CHECK_ERROR],
        );
        return $row;
    }

    private function auditLastMetadata(string $provider, string $eventType): ?array
    {
        $raw = $this->singleValue(
            'SELECT request_metadata FROM audit_events WHERE entity_type = :entity_type AND entity_id = :provider AND event_type = :event_type ORDER BY created_at DESC LIMIT 1',
            ['entity_type' => 'integration', 'provider' => $provider, 'event_type' => $eventType],
        );
        if ($raw === null) return null;
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : null;
    }

    // ---- Sanitized error classification -----------------------------------

    private function classifyProviderError(Throwable $error): string
    {
        $message = strtolower($error->getMessage());
        if (str_contains($message, 'reject') || str_contains($message, '401') || str_contains($message, 'unauthorized')) {
            return 'credentials rejected';
        }
        if (str_contains($message, 'unreachable') || str_contains($message, 'transport') || str_contains($message, 'timed out')) {
            return 'network or provider unavailable';
        }
        return 'provider request failed';
    }

    private function classifyGoogleError(Throwable $error): string
    {
        if ($error instanceof Google\Service\Exception) {
            $code = (int) $error->getCode();
            if ($code === 401 || $code === 403) return 'authentication failed';
            if ($code === 404) return 'configured resource not found';
            if ($code >= 500) return 'provider unavailable';
            return 'provider rejected the request';
        }
        $message = strtolower($error->getMessage());
        if (str_contains($message, 'not configured')) return 'not configured';
        if (str_contains($message, 'not installed')) return 'client library unavailable';
        return 'authentication or connectivity failure';
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
            'credentials rejected' => 'The configured credentials were rejected.',
            'authentication failed' => 'Authentication failed. The configured credentials may need attention.',
            'configured resource not found' => 'The configured calendar or folder could not be found.',
            'network or provider unavailable' => 'The provider was temporarily unreachable.',
            'provider unavailable' => 'The provider was temporarily unavailable.',
            'not configured' => 'The integration is not configured.',
            'provider error' => 'A provider error was recorded.',
            'rate limit exceeded' => 'Provider rate limit exceeded.',
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

    private function one(string $sql, array $params = []): ?array
    {
        $statement = $this->database->prepare($sql);
        $statement->execute($params);
        $row = $statement->fetch(PDO::FETCH_ASSOC);
        return $row === false ? null : $row;
    }
}
