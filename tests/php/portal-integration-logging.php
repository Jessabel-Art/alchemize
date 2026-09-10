<?php
$composerAutoload = __DIR__.'/../../vendor/autoload.php';
if (is_file($composerAutoload)) {
    require_once $composerAutoload;
}
require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/http/response.php';
require_once __DIR__.'/../../server/services/google-client-factory.php';
require_once __DIR__.'/../../server/services/google-calendar-service.php';
require_once __DIR__.'/../../server/services/google-drive-service.php';
require_once __DIR__.'/../../server/repositories/external-integration-repository.php';
require_once __DIR__.'/../../server/services/external-integration-service.php';
require_once __DIR__.'/../../server/services/stripe-payment-service.php';
function verifyLogging(bool $condition, string $message): void {if(!$condition)throw new RuntimeException($message);}

final class LoggingStubPDO extends PDO {
    public function __construct(){}
}

$logPath = dirname(__DIR__, 2) . '/server/private/logs/portal-errors.log';
$startSize = is_file($logPath) ? filesize($logPath) : 0;

function readNewLogLines(string $logPath, int $fromByte): array {
    if (!is_file($logPath)) return [];
    $handle = fopen($logPath, 'r');
    fseek($handle, $fromByte);
    $contents = stream_get_contents($handle);
    fclose($handle);
    return array_values(array_filter(explode("\n", $contents)));
}

// 1. The shared logger writes a structured, sanitized JSON line with the
// real exception class/message and no full stack trace or secret-shaped
// values, to a location outside the public web root (server/private/logs).
$sampleError = new RuntimeException('Sample diagnostic message for a fake failure.');
alchemize_runtime_error_log('tests/sample-operation', $sampleError, ['note' => 'unit test']);
$lines = readNewLogLines($logPath, $startSize);
verifyLogging(count($lines) >= 1, 'Expected at least one new log line');
$entry = json_decode(end($lines), true);
verifyLogging(is_array($entry), 'Log line is not valid JSON');
verifyLogging($entry['route'] === 'tests/sample-operation', 'Route label missing/wrong');
verifyLogging($entry['class'] === 'RuntimeException', 'Exception class missing/wrong');
verifyLogging(
    str_contains($entry['message'], 'Sample diagnostic message'),
    'Exception message missing/wrong',
);
verifyLogging(!array_key_exists('trace', $entry), 'Full stack trace must not be logged');
verifyLogging(!str_contains(json_encode($entry), 'password'), 'Sanity: no obvious secret-shaped key');

// 2. appointmentBusyPeriods(), given a misconfigured (but "configured()")
// calendar integration, still returns the sanitized CALENDAR_UNAVAILABLE
// response to the caller, but the REAL underlying exception (here: the
// Google credentials file cannot be found — the exact failure mode
// reproduced against an invalid/missing credentials path) is now captured
// in the diagnostic log instead of being discarded.
$badFactory = new AlchemizeGoogleClientFactory([
    'calendar_id' => 'test-calendar@group.calendar.google.com',
    'credentials_path' => '/nonexistent/path/credentials.json',
]);
$calendar = new AlchemizeGoogleCalendarService($badFactory, ['calendar_id' => 'test-calendar@group.calendar.google.com']);
$repository = new AlchemizeExternalIntegrationRepository(new LoggingStubPDO());
$integrations = new AlchemizeExternalIntegrationService($repository, null, $calendar, []);

$beforeSize = filesize($logPath);
try {
    $integrations->appointmentBusyPeriods('2030-01-01', 'America/New_York', true);
    verifyLogging(false, 'Expected a CALENDAR_UNAVAILABLE exception');
} catch (AlchemizeRequestException $error) {
    verifyLogging($error->httpStatus === 503, 'Expected 503');
    verifyLogging($error->errorCode === 'CALENDAR_UNAVAILABLE', 'Expected CALENDAR_UNAVAILABLE');
    verifyLogging(
        str_contains($error->getMessage(), 'temporarily unavailable'),
        'Sanitized message must not leak provider detail',
    );
}
$newLines = readNewLogLines($logPath, $beforeSize);
verifyLogging(count($newLines) >= 1, 'Expected a diagnostic log entry for the real exception');
$loggedEntry = json_decode(end($newLines), true);
verifyLogging($loggedEntry['route'] === 'portal/appointments/availability', 'Wrong route label logged');
verifyLogging(
    str_contains($loggedEntry['message'], 'credentials'),
    'Expected the real "Google credentials are not configured." cause to be captured, got: ' . $loggedEntry['message'],
);

echo "Portal integration logging: structured diagnostic log entries capture the real exception behind sanitized client responses, without stack traces or secrets.\n";
