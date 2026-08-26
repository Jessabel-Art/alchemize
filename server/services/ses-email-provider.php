<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

final class AlchemizeSesSmtpEmailProvider implements AlchemizeEmailProvider
{
    public function __construct(private readonly array $config) {}

    public function configurationStatus(): array
    {
        return [
            'AWS_REGION' => trim((string) ($this->config['region'] ?? '')) !== '',
            'SES_SMTP_HOST' => trim((string) ($this->config['host'] ?? '')) !== '',
            'SES_SMTP_PORT' => (int) ($this->config['port'] ?? 0) === 587,
            'SES_SMTP_USERNAME' => trim((string) ($this->config['username'] ?? '')) !== '',
            'SES_SMTP_PASSWORD' => trim((string) ($this->config['password'] ?? '')) !== '',
            'SES_FROM_EMAIL' => filter_var($this->config['from_email'] ?? '', FILTER_VALIDATE_EMAIL) !== false,
            'SES_FROM_NAME' => trim((string) ($this->config['from_name'] ?? '')) !== '',
            'SES_REPLY_TO_EMAIL' => filter_var($this->config['reply_to_email'] ?? '', FILTER_VALIDATE_EMAIL) !== false,
        ];
    }

    public function initialize(): PHPMailer
    {
        if (!class_exists(PHPMailer::class)) {
            throw new RuntimeException('The SMTP email library is not installed.');
        }
        if (in_array(false, $this->configurationStatus(), true)) {
            throw new RuntimeException('SES SMTP configuration is incomplete.');
        }

        $mailer = new PHPMailer(true);
        $mailer->isSMTP();
        $mailer->Host = (string) $this->config['host'];
        $mailer->Port = 587;
        $mailer->SMTPAuth = true;
        $mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mailer->Username = (string) $this->config['username'];
        $mailer->Password = (string) $this->config['password'];
        $mailer->CharSet = PHPMailer::CHARSET_UTF8;
        $mailer->setFrom((string) $this->config['from_email'], (string) $this->config['from_name']);
        $mailer->addReplyTo((string) $this->config['reply_to_email']);
        return $mailer;
    }

    public function queue(array $notification): void
    {
        try {
            $recipient = (string) ($notification['recipient_email'] ?? '');
            if (filter_var($recipient, FILTER_VALIDATE_EMAIL) === false) {
                throw new RuntimeException('The email recipient is invalid.');
            }

            $mailer = $this->initialize();
            $mailer->addAddress($recipient);
            $mailer->Subject = (string) ($notification['title'] ?? 'Alchemize notification');
            $plainText = trim((string) ($notification['message_body'] ?? ''));
            $mailer->isHTML(true);
            $mailer->Body = '<p>' . nl2br(htmlspecialchars($plainText, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')) . '</p>';
            $mailer->AltBody = $plainText;
            $mailer->send();
        } catch (Throwable $error) {
            $notificationId = preg_replace('/[^A-Za-z0-9-]/', '', (string) ($notification['public_id'] ?? 'unknown'));
            error_log(sprintf(
                'SES email delivery failed for notification %s [%s].',
                $notificationId !== '' ? $notificationId : 'unknown',
                get_class($error),
            ));
        }
    }
}

function alchemize_email_provider(array $config): AlchemizeEmailProvider
{
    $provider = new AlchemizeSesSmtpEmailProvider($config['ses'] ?? []);
    if (class_exists(PHPMailer::class) && !in_array(false, $provider->configurationStatus(), true)) {
        return $provider;
    }
    return new AlchemizeNullEmailProvider();
}
