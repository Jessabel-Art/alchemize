<?php

declare(strict_types=1);

final class AlchemizeResendEmailProvider implements AlchemizeEmailProvider
{
    private array $lastDeliveryResult = [
        'status' => 'unavailable',
        'provider_id' => null,
        'error' => null,
        'attempted' => false,
    ];

    public function __construct(private readonly array $config) {}

    public function lastDeliveryResult(): array
    {
        return $this->lastDeliveryResult;
    }

    public function configurationStatus(): array
    {
        return [
            'RESEND_API_KEY' => trim((string) ($this->config['api_key'] ?? '')) !== '',
            'RESEND_FROM_EMAIL' => filter_var((string) ($this->config['from_email'] ?? 'notifications@getalchemize.com'), FILTER_VALIDATE_EMAIL) !== false,
            'RESEND_FROM_NAME' => trim((string) ($this->config['from_name'] ?? 'Alchemize Business Services')) !== '',
            'RESEND_REPLY_TO_EMAIL' => filter_var((string) ($this->config['reply_to_email'] ?? 'admin@getalchemize.com'), FILTER_VALIDATE_EMAIL) !== false,
        ];
    }

    public function queue(array $notification): void
    {
        $this->deliver($notification);
    }

    public function deliverDetailed(array $notification): array
    {
        $this->lastDeliveryResult = [
            'status' => 'unavailable',
            'provider_id' => null,
            'error' => null,
            'attempted' => false,
        ];

        try {
            $recipient = (string) ($notification['recipient_email'] ?? '');
            if (filter_var($recipient, FILTER_VALIDATE_EMAIL) === false) {
                throw new RuntimeException('The email recipient is invalid.');
            }

            if (in_array(false, $this->configurationStatus(), true)) {
                $this->lastDeliveryResult['status'] = 'unavailable';
                $this->lastDeliveryResult['error'] = 'missing_resend_configuration';
                $this->lastDeliveryResult['attempted'] = false;
                return $this->lastDeliveryResult;
            }

            $fromName = (string) ($this->config['from_name'] ?? 'Alchemize Business Services');
            $fromEmail = (string) ($this->config['from_email'] ?? 'notifications@getalchemize.com');
            $replyTo = (string) ($this->config['reply_to_email'] ?? 'admin@getalchemize.com');
            $subject = 'Alchemize | ' . (string) ($notification['title'] ?? 'Account notification');
            $payload = alchemize_render_email_template([
                'title' => (string) ($notification['title'] ?? 'Account notification'),
                'message_body' => (string) ($notification['message_body'] ?? ''),
                'preheader' => (string) ($notification['preheader'] ?? ''),
                'action_url' => (string) ($notification['action_url'] ?? ''),
                'action_label' => (string) ($notification['action_label'] ?? ''),
                'secondary_text' => (string) ($notification['secondary_text'] ?? 'This transactional notice contains no document contents or password information.'),
            ], (string) ($notification['app_url'] ?? 'https://www.getalchemize.com'));

            $payloadToSend = [
                'from' => sprintf('%s <%s>', $fromName, $fromEmail),
                'to' => [$recipient],
                'reply_to' => $replyTo,
                'subject' => $subject,
                'html' => $payload['html'],
                'text' => $payload['text'],
            ];

            $apiKey = (string) ($this->config['api_key'] ?? '');
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => [
                        'Authorization: Bearer ' . $apiKey,
                        'Content-Type: application/json',
                        'Accept: application/json',
                    ],
                    'content' => json_encode($payloadToSend, JSON_THROW_ON_ERROR),
                    'ignore_errors' => true,
                    'timeout' => 20,
                ],
            ]);

            $response = @file_get_contents('https://api.resend.com/emails', false, $context);
            $this->lastDeliveryResult['attempted'] = true;
            if ($response === false || !is_string($response)) {
                $this->lastDeliveryResult['status'] = 'failed';
                $this->lastDeliveryResult['error'] = 'resend_request_failed';
                return $this->lastDeliveryResult;
            }

            $decoded = json_decode($response, true);
            if (!is_array($decoded) || empty($decoded['id'])) {
                $this->lastDeliveryResult['status'] = 'failed';
                $this->lastDeliveryResult['error'] = is_array($decoded) && isset($decoded['message']) ? (string) $decoded['message'] : 'resend_rejected_request';
                return $this->lastDeliveryResult;
            }

            $this->lastDeliveryResult['status'] = 'sent';
            $this->lastDeliveryResult['provider_id'] = (string) $decoded['id'];
            $this->lastDeliveryResult['error'] = null;
            return $this->lastDeliveryResult;
        } catch (Throwable $error) {
            $notificationId = preg_replace('/[^A-Za-z0-9-]/', '', (string) ($notification['public_id'] ?? 'unknown'));
            error_log(sprintf(
                'Resend email delivery failed for notification %s [%s].',
                $notificationId !== '' ? $notificationId : 'unknown',
                get_class($error),
            ));
            $this->lastDeliveryResult['status'] = in_array(false, $this->configurationStatus(), true) ? 'unavailable' : 'failed';
            $this->lastDeliveryResult['error'] = in_array(false, $this->configurationStatus(), true) ? 'missing_resend_configuration' : 'provider_exception';
            $this->lastDeliveryResult['attempted'] = true;
            return $this->lastDeliveryResult;
        }
    }

    public function deliver(array $notification): string
    {
        return $this->deliverDetailed($notification)['status'];
    }

    // GET /domains is a safe, authenticated, read-only Resend endpoint --
    // it proves the API key itself is valid without sending a real email
    // just to test connectivity.
    public function verifyConnection(): array
    {
        if (in_array(false, $this->configurationStatus(), true)) {
            throw new RuntimeException('Resend is not configured.');
        }
        $apiKey = (string) ($this->config['api_key'] ?? '');
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => ['Authorization: Bearer ' . $apiKey, 'Accept: application/json'],
                'ignore_errors' => true,
                'timeout' => 15,
            ],
        ]);
        $response = @file_get_contents('https://api.resend.com/domains', false, $context);
        $status = 0;
        foreach ($http_response_header ?? [] as $header) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $header, $matches)) {
                $status = (int) $matches[1];
                break;
            }
        }
        if ($status === 401 || $status === 403) {
            throw new RuntimeException('Resend rejected the configured API key.');
        }
        if ($response === false || !is_string($response) || $status < 200 || $status >= 300) {
            throw new RuntimeException($status === 0 ? 'Resend was unreachable.' : 'Resend API request failed.');
        }
        return ['connected' => true];
    }
}

function alchemize_email_provider(array $config): AlchemizeEmailProvider
{
    $providerName = strtolower((string) ($config['email_provider'] ?? 'resend'));
    if ($providerName !== 'resend') {
        return new AlchemizeNullEmailProvider();
    }

    $provider = new AlchemizeResendEmailProvider($config['resend'] ?? []);
    return in_array(false, $provider->configurationStatus(), true) ? new AlchemizeNullEmailProvider() : $provider;
}
