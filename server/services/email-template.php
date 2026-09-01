<?php

declare(strict_types=1);

function alchemize_email_logo_url(string $appUrl): string
{
    $base = rtrim($appUrl, '/');
    if ($base === '') {
        return 'https://www.getalchemize.com/assets/logos/alchemize-logo-dark.png';
    }

    if (preg_match('#^https?://#i', $base) === 1) {
        return $base . '/assets/logos/alchemize-logo-dark.png';
    }

    return 'https://www.getalchemize.com/assets/logos/alchemize-logo-dark.png';
}

function alchemize_email_render_safe_text(string $value): string
{
    return trim((string) $value);
}

function alchemize_email_validate_action_url(string $url): ?string
{
    $value = trim((string) $url);
    if ($value === '') {
        return null;
    }

    if (preg_match('#^https?://#i', $value) !== 1) {
        return null;
    }

    return $value;
}

function alchemize_render_email_template(array $payload, string $appUrl = 'https://www.getalchemize.com'): array
{
    $title = trim((string) ($payload['title'] ?? 'Account update'));
    $body = trim((string) ($payload['message_body'] ?? ''));
    $preheader = trim((string) ($payload['preheader'] ?? ''));
    $actionUrl = alchemize_email_validate_action_url((string) ($payload['action_url'] ?? ''));
    $actionLabel = trim((string) ($payload['action_label'] ?? ''));
    $supportText = trim((string) ($payload['secondary_text'] ?? ''));

    $safeTitle = htmlspecialchars($title !== '' ? $title : 'Account update', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeBody = preg_replace('/\r\n|\r|\n/', "\n", $body);
    $safeBody = htmlspecialchars($safeBody, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeBody = nl2br($safeBody, false);

    $headerBrand = 'Alchemize Business Services';
    $brandUrl = alchemize_email_logo_url($appUrl);
    $brandMarkup = '<img src="' . htmlspecialchars($brandUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '" alt="Alchemize Business Services" width="180" height="40" style="display:block;max-width:180px;height:auto;border:0;outline:none;text-decoration:none;" />';

    $htmlBody = $safeBody;
    $textBody = preg_replace('/\s*\n\s*/', "\n", $body);
    $textBody = trim($textBody);

    $ctaHtml = '';
    $ctaText = '';
    if ($actionUrl !== null && $actionLabel !== '') {
        $ctaUrl = htmlspecialchars($actionUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $ctaLabel = htmlspecialchars($actionLabel, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $ctaHtml = '<tr>'
            . '<td align="center" style="padding:0 0 30px 0;">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">'
            . '<tr>'
            . '<td style="background-color:#d7b05f;border-radius:4px;text-align:center;">'
            . '<a href="' . $ctaUrl . '" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:18px;color:#122a2a;text-decoration:none;">' . $ctaLabel . '</a>'
            . '</td>'
            . '</tr>'
            . '</table>'
            . '</td>'
            . '</tr>';
        $ctaText = "\n\n" . $actionLabel . ': ' . $actionUrl;
    }

    $footerText = 'This message was sent regarding activity associated with your Alchemize account or service request.';
    if ($supportText !== '') {
        $footerText = htmlspecialchars($supportText, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    $content = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f1e8;margin:0;padding:0;width:100%;">'
        . '<tr><td align="center" style="padding:30px 16px;">'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background-color:#f9f7f2;border:1px solid #d9d1bc;border-collapse:separate;">'
        . '<tr><td style="background-color:#102b2c;padding:24px 24px 18px 24px;">'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">'
        . '<tr>'
        . '<td align="left" style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;line-height:26px;color:#f9f7f2;">'
        . $brandMarkup
        . '</td>'
        . '</tr>'
        . '</table>'
        . '</td></tr>'
        . '<tr><td style="padding:0;">'
        . ($preheader !== '' ? '<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#f9f7f2;">' . htmlspecialchars($preheader, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</div>' : '')
        . '</td></tr>'
        . '<tr><td style="padding:28px 32px 8px 32px;">'
        . '<h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:34px;font-weight:700;color:#112a2a;">' . $safeTitle . '</h1>'
        . '</td></tr>'
        . '<tr><td style="padding:0 32px 12px 32px;">'
        . '<div style="border-bottom:3px solid #d7b05f;width:56px;height:0;display:block;"></div>'
        . '</td></tr>'
        . '<tr><td style="padding:0 32px 20px 32px;">'
        . '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#1f2b2d;">' . $htmlBody . '</div>'
        . '</td></tr>'
        . $ctaHtml
        . '<tr><td style="padding:0 32px 24px 32px;">'
        . '<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#4d5e5f;">'
        . 'Alchemize Business Services<br>'
        . 'getalchemize.com<br>'
        . 'admin@getalchemize.com'
        . '</div>'
        . '</td></tr>'
        . '<tr><td style="padding:0 32px 28px 32px;">'
        . '<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#536565;">' . $footerText . '</div>'
        . '</td></tr>'
        . '</table>'
        . '</td></tr>'
        . '</table>';

    $fallbackBody = trim($body);
    $text = "Alchemize Business Services\n\n" . $title . "\n\n" . $fallbackBody;
    if ($actionUrl !== null && $actionLabel !== '') {
        $text .= "\n\n" . $actionLabel . ': ' . $actionUrl;
    }
    $text .= "\n\ngetalchemize.com\nadmin@getalchemize.com\n\nThis message was sent regarding activity associated with your Alchemize account or service request.";

    return ['html' => $content, 'text' => $text];
}
